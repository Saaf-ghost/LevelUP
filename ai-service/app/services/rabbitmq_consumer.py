import asyncio
import json
import logging
import threading
import time
import pika
import httpx
from pika.exceptions import AMQPConnectionError

from app.core.config import get_settings
from app.schemas.job import JobMessage, JobCallbackPayload
from app.services.pdf_extractor import extract_text_from_pdf
from app.services.ollama_service import decompose_prd

logger = logging.getLogger(__name__)


class RabbitMQWorker:
    def __init__(self):
        self.settings = get_settings()
        self.connection = None
        self.channel = None
        self._is_running = False

    def _connect(self):
        credentials = pika.PlainCredentials(
            self.settings.rabbitmq_user,
            self.settings.rabbitmq_password
        )
        parameters = pika.ConnectionParameters(
            host=self.settings.rabbitmq_host,
            port=self.settings.rabbitmq_port,
            credentials=credentials,
            heartbeat=60,
            blocked_connection_timeout=300,
        )
        return pika.BlockingConnection(parameters)

    def _notify_spring_backend(self, payload: JobCallbackPayload):
        url = f"{self.settings.backend_api_base}{self.settings.backend_callback_path.format(job_id=payload.job_id)}"
        try:
            with httpx.Client(timeout=15.0) as client:
                res = client.post(
                    url,
                    json=payload.model_dump(),
                    headers={"X-AI-Callback-Token": self.settings.backend_callback_token},
                )
                logger.info(f"Backend notified for job {payload.job_id} ({payload.status}): HTTP {res.status_code}")
        except Exception as exc:
            logger.error(f"Failed to post status update to Spring Boot callback: {exc}")

    def _process_message(self, ch, method, properties, body):
        data = None
        try:
            data = json.loads(body.decode("utf-8"))
            job = JobMessage.model_validate(data)
            logger.info(f"[*] Received processing job: {job.job_id} for project {job.project_id}")

            # Step 1: Notify Backend -> EXTRACTING_PDF
            self._notify_spring_backend(JobCallbackPayload(
                job_id=job.job_id,
                project_id=job.project_id,
                status="EXTRACTING_PDF"
            ))

            # Step 2: Extract text (PyMuPDF + EasyOCR fallback)
            extraction_result = extract_text_from_pdf(job.file_path)

            # Step 3: Notify Backend -> RUNNING_LLM
            self._notify_spring_backend(JobCallbackPayload(
                job_id=job.job_id,
                project_id=job.project_id,
                status="RUNNING_LLM"
            ))

            # Step 4: Run Ollama structured decomposition
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                decomposition = loop.run_until_complete(decompose_prd(extraction_result.full_text))
            finally:
                loop.close()

            # Step 5: Deliver final result to Spring Boot gateway
            self._notify_spring_backend(JobCallbackPayload(
                job_id=job.job_id,
                project_id=job.project_id,
                status="COMPLETED",
                result=decomposition
            ))

            # Step 6: Acknowledge successful processing
            ch.basic_ack(delivery_tag=method.delivery_tag)
            logger.info(f"[+] Job {job.job_id} successfully processed and acknowledged.")

        except Exception as exc:
            logger.exception(f"[-] Error processing job: {exc}")
            # Try to inform Spring Boot of failure
            try:
                job_id = data.get("job_id", "unknown") if isinstance(data, dict) else "unknown"
                project_id = data.get("project_id", 0) if isinstance(data, dict) else 0
                self._notify_spring_backend(JobCallbackPayload(
                    job_id=job_id,
                    project_id=project_id,
                    status="FAILED",
                    error_message=str(exc)
                ))
            except Exception:
                pass

            # Reject without requeue -> RabbitMQ will automatically route to Dead Letter Queue (DLQ)
            ch.basic_reject(delivery_tag=method.delivery_tag, requeue=False)
            logger.warning(f"[!] Message rejected and sent to DLQ: {self.settings.rabbitmq_dlq}")

    def start_consuming(self):
        self._is_running = True
        while self._is_running:
            try:
                logger.info(f"Connecting to RabbitMQ at {self.settings.rabbitmq_host}:{self.settings.rabbitmq_port}...")
                self.connection = self._connect()
                self.channel = self.connection.channel()

                # Declare exchange and DLX
                self.channel.exchange_declare(
                    exchange=self.settings.rabbitmq_exchange,
                    exchange_type="direct",
                    durable=True
                )
                self.channel.exchange_declare(
                    exchange=self.settings.rabbitmq_dlx,
                    exchange_type="direct",
                    durable=True
                )

                # Declare Dead Letter Queue
                self.channel.queue_declare(
                    queue=self.settings.rabbitmq_dlq,
                    durable=True
                )
                self.channel.queue_bind(
                    exchange=self.settings.rabbitmq_dlx,
                    queue=self.settings.rabbitmq_dlq,
                    routing_key=self.settings.rabbitmq_dlq_routing_key
                )

                # Declare Main Work Queue with DLX arguments
                args = {
                    "x-dead-letter-exchange": self.settings.rabbitmq_dlx,
                    "x-dead-letter-routing-key": self.settings.rabbitmq_dlq_routing_key,
                }
                self.channel.queue_declare(
                    queue=self.settings.rabbitmq_queue,
                    durable=True,
                    arguments=args
                )
                self.channel.queue_bind(
                    exchange=self.settings.rabbitmq_exchange,
                    queue=self.settings.rabbitmq_queue,
                    routing_key=self.settings.rabbitmq_routing_key
                )

                # Set prefetch count to prevent overloading local GPU / Ollama
                self.channel.basic_qos(prefetch_count=self.settings.rabbitmq_prefetch_count)
                self.channel.basic_consume(
                    queue=self.settings.rabbitmq_queue,
                    on_message_callback=self._process_message
                )

                logger.info(f"[*] RabbitMQ worker listening on '{self.settings.rabbitmq_queue}'. Awaiting jobs...")
                self.channel.start_consuming()

            except (AMQPConnectionError, ConnectionResetError) as err:
                if not self._is_running:
                    break
                logger.warning(f"RabbitMQ connection lost ({err}). Retrying in 5 seconds...")
                time.sleep(5)
            except Exception as err:
                if not self._is_running:
                    break
                logger.error(f"Unexpected worker error: {err}. Retrying in 5 seconds...")
                time.sleep(5)

    def stop(self):
        self._is_running = False
        if self.channel and self.channel.is_open:
            self.channel.stop_consuming()
        if self.connection and self.connection.is_open:
            self.connection.close()


def launch_worker_thread() -> RabbitMQWorker:
    worker = RabbitMQWorker()
    thread = threading.Thread(target=worker.start_consuming, daemon=True)
    thread.start()
    return worker

