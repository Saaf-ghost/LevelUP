"""Standalone CLI entry point for running the RabbitMQ consumer as a dedicated worker process."""

import logging
import signal
import sys
from app.services.rabbitmq_consumer import RabbitMQWorker

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("boostup.worker")


def main():
    logger.info("Starting BoostUP RabbitMQ AI Worker process...")
    worker = RabbitMQWorker()

    def handle_sigterm(signum, frame):
        logger.info(f"Signal {signum} received. Stopping worker...")
        worker.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_sigterm)
    signal.signal(signal.SIGTERM, handle_sigterm)

    worker.start_consuming()


if __name__ == "__main__":
    main()

