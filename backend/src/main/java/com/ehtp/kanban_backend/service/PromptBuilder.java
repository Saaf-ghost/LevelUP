package com.ehtp.kanban_backend.service;

import com.ehtp.kanban_backend.dto.BottleneckDTO;
import com.ehtp.kanban_backend.dto.HealthDTO;
import com.ehtp.kanban_backend.dto.VelocityTrendDTO;
import com.ehtp.kanban_backend.dto.WorkloadDTO;
import com.ehtp.kanban_backend.model.Task;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PromptBuilder {
    public String sprintRiskPrompt(HealthDTO health, int remainingWork, int remainingCapacity) {
        return """
                Return JSON only with keys riskLevel, explanation, rootCause, recommendedAction.
                Analyze this sprint:
                healthScore=%d, status=%s, remainingWork=%d, remainingCapacity=%d.
                """.formatted(health.score(), health.statusLabel(), remainingWork, remainingCapacity);
    }

    public String reassignmentPrompt(List<WorkloadDTO> workloads, List<Task> tasks, List<BottleneckDTO> bottlenecks) {
        return """
                Return JSON only with keys suggestedReassignments, rationale, estimatedImpactOnHealthScore.
                suggestedReassignments is an array of objects with taskId, taskTitle, fromUserId, fromUserName, toUserId, toUserName, rationale.
                Workloads: %s
                Tasks: %s
                Bottlenecks: %s
                """.formatted(workloads, summarizeTasks(tasks), bottlenecks);
    }

    public String retrospectivePrompt(List<VelocityTrendDTO> trend) {
        return """
                Return JSON only with keys patterns, conclusion, recommendation.
                patterns must be an array of short strings.
                Velocity trend: %s
                """.formatted(trend);
    }

    private String summarizeTasks(List<Task> tasks) {
        return tasks.stream()
                .map(task -> "{id=%d,title=%s,status=%s,points=%d,assignee=%s}".formatted(
                        task.getId(),
                        task.getTitle(),
                        task.getStatus(),
                        task.getEffortPoints(),
                        task.getAssignee() == null ? "unassigned" : task.getAssignee().getFullName()
                ))
                .toList()
                .toString();
    }
}
