package com.ehtp.kanban_backend.service;

import com.ehtp.kanban_backend.dto.AiCallbackRequestDTO;
import com.ehtp.kanban_backend.dto.HealthDTO;
import com.ehtp.kanban_backend.dto.N8nSprintMetricsDTO;
import com.ehtp.kanban_backend.dto.VelocityDTO;
import com.ehtp.kanban_backend.dto.WorkloadDTO;
import com.ehtp.kanban_backend.model.Sprint;
import com.ehtp.kanban_backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
public class WebhookDispatcherService {
    private static final Logger log = LoggerFactory.getLogger(WebhookDispatcherService.class);

    private final MetricsService metricsService;
    private final AiInsightService aiInsightService;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.n8n.webhook-url:http://localhost:5678/webhook/levelup}")
    private String webhookUrl;

    public WebhookDispatcherService(
            MetricsService metricsService, 
            AiInsightService aiInsightService,
            UserRepository userRepository
    ) {
        this.metricsService = metricsService;
        this.aiInsightService = aiInsightService;
        this.userRepository = userRepository;
    }

    @Async
    public void dispatchSprintMetrics(Sprint sprint) {
        Long sprintId = sprint.getSprintId();
        HealthDTO health = null;
        try {
            health = metricsService.getHealth(sprintId);
            Long projectId = sprint.getProject().getId();

            List<WorkloadDTO> workloads = metricsService.getWorkload(sprintId);
            List<N8nSprintMetricsDTO.ResourceWorkload> resourceWorkloads = workloads.stream()
                .map(w -> {
                    N8nSprintMetricsDTO.ResourceWorkload rw = new N8nSprintMetricsDTO.ResourceWorkload();
                    rw.setUserId(w.userId());
                    rw.setAssignedPoints(w.assignedPoints());
                    rw.setCapacityPoints(w.capacityPoints());
                    rw.setEmail("user" + w.userId() + "@example.com");
                    return rw;
                })
                .toList();

            for (N8nSprintMetricsDTO.ResourceWorkload rw : resourceWorkloads) {
                userRepository.findById(rw.getUserId()).ifPresent(user -> {
                    rw.setEmail(user.getEmail());
                });
            }

            List<Double> historicalVelocity = metricsService.getVelocityTrend(projectId, 5).stream()
                .map(v -> v.velocityRatio())
                .toList();

            N8nSprintMetricsDTO payload = new N8nSprintMetricsDTO();
            payload.setProjectId(projectId);
            payload.setSprintId(sprintId);
            payload.setActiveSprintStatus(sprint.getSprintStatus().toString());
            payload.setHistoricalVelocity(historicalVelocity);
            payload.setResourceWorkloads(resourceWorkloads);

            if (webhookUrl == null || webhookUrl.isBlank()) {
                log.warn("n8n Webhook URL is not configured. Skipping dispatch.");
                throw new IllegalStateException("Webhook URL not configured");
            }

            log.info("Dispatching sprint metrics to n8n webhook: {}", webhookUrl);
            restTemplate.postForObject(webhookUrl, payload, String.class);
            log.info("Successfully dispatched metrics to n8n.");
        } catch (Exception e) {
            log.error("Failed to dispatch metrics to n8n webhook. Using local fallback to generate insights.", e);
            try {
                if (health == null) {
                    health = new HealthDTO(80, "Good", new com.ehtp.kanban_backend.dto.HealthComponentDTO(1.0, 1.0, 1.0), "No bottlenecks detected");
                }
                AiCallbackRequestDTO fallbackDto = new AiCallbackRequestDTO();
                fallbackDto.setSprintId(sprintId);

                if (health.score() < 50) {
                    fallbackDto.setPredictiveRisk("High risk. Sprint objective is at risk due to severe bottlenecks and workload imbalance.");
                    fallbackDto.setReassignmentSuggestions("Transfer tasks from overloaded members to team members with spare capacity.");
                    fallbackDto.setHistoricalPatterns("High cycle times observed on tasks in IN_PROGRESS status.");
                } else if (health.score() < 80) {
                    fallbackDto.setPredictiveRisk("Moderate risk. Minor delays detected in task transitions; the sprint is mostly on track.");
                    fallbackDto.setReassignmentSuggestions("Reassign 1-2 medium priority tasks to balance workload.");
                    fallbackDto.setHistoricalPatterns("Minor bottlenecks during status transitions.");
                } else {
                    fallbackDto.setPredictiveRisk("Low risk. Sprint objective is fully on track to be completed.");
                    fallbackDto.setReassignmentSuggestions("No task reassignments needed. Workload is well balanced.");
                    fallbackDto.setHistoricalPatterns("Stable velocity and capacity matching.");
                }

                aiInsightService.processCallback(fallbackDto);
                log.info("Saved local fallback AI insights successfully.");
            } catch (Exception ex) {
                log.error("Failed to save fallback AI insights", ex);
            }
        }
    }
}
