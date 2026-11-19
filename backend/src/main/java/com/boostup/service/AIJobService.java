package com.boostup.service;

import com.boostup.dto.*;
import com.boostup.model.*;
import com.boostup.repository.AIJobRepository;
import com.boostup.repository.ProjetRepository;
import com.boostup.repository.RequirementRepository;
import com.boostup.repository.TaskRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class AIJobService {

    private static final Logger logger = LoggerFactory.getLogger(AIJobService.class);

    private final AIJobRepository jobRepository;
    private final ProjetRepository projetRepository;
    private final RequirementRepository requirementRepository;
    private final TaskRepository taskRepository;
    private final RabbitTemplate rabbitTemplate;
    private final AuthorizationService authorizationService;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Value("${app.rabbitmq.exchange:boostup.ai.exchange}")
    private String exchange;

    @Value("${app.rabbitmq.routing-key:pdf.job.process}")
    private String routingKey;

    public AIJobService(
            AIJobRepository jobRepository,
            ProjetRepository projetRepository,
            RequirementRepository requirementRepository,
            TaskRepository taskRepository,
            RabbitTemplate rabbitTemplate,
            AuthorizationService authorizationService
    ) {
        this.jobRepository = jobRepository;
        this.projetRepository = projetRepository;
        this.requirementRepository = requirementRepository;
        this.taskRepository = taskRepository;
        this.rabbitTemplate = rabbitTemplate;
        this.authorizationService = authorizationService;
    }

    public AIJobStatusDTO submitPdfForDecomposition(Long projectId, MultipartFile file) {
        Projet projet = projetRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
        authorizationService.requireProjectEditor(projectId);

        if (file.isEmpty() || file.getOriginalFilename() == null || !file.getOriginalFilename().toLowerCase().endsWith(".pdf")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid PDF file is required.");
        }

        String jobId = UUID.randomUUID().toString();
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String sanitizedName = file.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_");
            String storedFileName = jobId + "_" + sanitizedName;
            Path targetLocation = uploadPath.resolve(storedFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            AIJob job = new AIJob();
            job.setJobId(jobId);
            job.setProjectId(projectId);
            job.setFileName(file.getOriginalFilename());
            job.setFilePath(targetLocation.toString());
            job.setStatus(AIJobStatus.PENDING);
            jobRepository.save(job);

            // Publish job message to RabbitMQ
            AIJobMessageDTO message = new AIJobMessageDTO(jobId, projectId, targetLocation.toString());
            rabbitTemplate.convertAndSend(exchange, routingKey, message);
            logger.info("Published AI decomposition job {} to RabbitMQ exchange {} with routing key {}", jobId, exchange, routingKey);

            return new AIJobStatusDTO(job.getJobId(), job.getProjectId(), job.getStatus(), "Job submitted to queue");

        } catch (IOException ex) {
            logger.error("Failed to store uploaded PDF", ex);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store PDF file", ex);
        }
    }

    public AIJobStatusDTO getJobStatus(String jobId) {
        AIJob job = jobRepository.findByJobId(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));
        authorizationService.requireProjectViewer(job.getProjectId());
        return new AIJobStatusDTO(job.getJobId(), job.getProjectId(), job.getStatus(), job.getErrorMessage());
    }

    @Transactional
    public void handleWorkerCallback(String jobId, BacklogDecompositionCallbackDTO callback) {
        AIJob job = jobRepository.findByJobId(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found: " + jobId));

        if (job.getStatus() == AIJobStatus.COMPLETED || job.getStatus() == AIJobStatus.FAILED) {
            logger.info("Ignoring duplicate callback for already finished job {}", jobId);
            return;
        }

        String incomingStatus = callback.getStatus();
        logger.info("Received callback for job {} with status {}", jobId, incomingStatus);

        if ("FAILED".equalsIgnoreCase(incomingStatus)) {
            job.setStatus(AIJobStatus.FAILED);
            job.setErrorMessage(callback.getErrorMessage() != null ? callback.getErrorMessage() : "AI processing failed");
            jobRepository.save(job);
            return;
        }

        if (incomingStatus != null && !incomingStatus.equalsIgnoreCase("COMPLETED")) {
            try {
                job.setStatus(AIJobStatus.valueOf(incomingStatus.toUpperCase()));
                jobRepository.save(job);
            } catch (IllegalArgumentException e) {
                logger.warn("Unknown intermediate status: {}", incomingStatus);
            }
            return;
        }

        // Handle COMPLETED state
        Projet projet = projetRepository.findById(job.getProjectId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found: " + job.getProjectId()));

        int totalRequirements = 0;
        int totalTasks = 0;

        if (callback.getResult() != null && callback.getResult().getRequirements() != null) {
            for (var reqDTO : callback.getResult().getRequirements()) {
                Requirement req = new Requirement();
                req.setTitle(reqDTO.getTitle() != null ? reqDTO.getTitle() : "Untitled Requirement");
                req.setDescription(reqDTO.getDescription() != null ? reqDTO.getDescription() : "");
                req.setStatus(Requirement.RequirementStatus.BACKLOG);
                req.setProject(projet);
                Requirement savedReq = requirementRepository.save(req);
                totalRequirements++;

                int reqPoints = 0;
                if (reqDTO.getUserStories() != null) {
                    for (var storyDTO : reqDTO.getUserStories()) {
                        String criteriaStr = storyDTO.getAcceptanceCriteria() != null
                                ? String.join("\n- ", storyDTO.getAcceptanceCriteria())
                                : "";

                        if (storyDTO.getTasks() != null && !storyDTO.getTasks().isEmpty()) {
                            for (var taskDTO : storyDTO.getTasks()) {
                                Task task = new Task();
                                task.setTitle(taskDTO.getTitle() != null ? taskDTO.getTitle() : "Untitled Task");
                                
                                StringBuilder descBuilder = new StringBuilder();
                                if (storyDTO.getTitle() != null && !storyDTO.getTitle().isBlank()) {
                                    descBuilder.append("Story: ").append(storyDTO.getTitle()).append("\n\n");
                                }
                                if (!criteriaStr.isBlank()) {
                                    descBuilder.append("Acceptance Criteria:\n- ").append(criteriaStr).append("\n\n");
                                }
                                if (taskDTO.getDescription() != null && !taskDTO.getDescription().isBlank()) {
                                    descBuilder.append("Notes: ").append(taskDTO.getDescription());
                                }
                                
                                String finalDesc = descBuilder.toString().trim();
                                if (finalDesc.length() > 1950) {
                                    finalDesc = finalDesc.substring(0, 1950) + "...";
                                }
                                task.setDescription(finalDesc);
                                task.setStatus(Task.TaskStatus.TODO);

                                try {
                                    task.setPriority(Task.Priority.valueOf(taskDTO.getPriority().toUpperCase()));
                                } catch (Exception e) {
                                    task.setPriority(Task.Priority.MEDIUM);
                                }

                                int points = (taskDTO.getEffortPoints() != null && taskDTO.getEffortPoints() > 0)
                                        ? taskDTO.getEffortPoints() : 3;
                                int hours = (taskDTO.getEstimatedHours() != null && taskDTO.getEstimatedHours() > 0)
                                        ? taskDTO.getEstimatedHours() : 4;

                                task.setEffortPoints(points);
                                task.setEstimatedHours(hours);
                                task.setRequirement(savedReq);
                                taskRepository.save(task);

                                reqPoints += points;
                                totalTasks++;
                            }
                        }
                    }
                }
                savedReq.setStoryPoints(reqPoints);
                requirementRepository.save(savedReq);
            }
        }

        job.setStatus(AIJobStatus.COMPLETED);
        job.setResultSummary("Generated " + totalRequirements + " requirements and " + totalTasks + " technical tasks.");
        jobRepository.save(job);
        logger.info("Decomposition successfully persisted for job {}: {} requirements, {} tasks.", jobId, totalRequirements, totalTasks);
    }
}

