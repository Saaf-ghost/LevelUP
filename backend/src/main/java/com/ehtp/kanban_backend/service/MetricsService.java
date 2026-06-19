package com.ehtp.kanban_backend.service;

import com.ehtp.kanban_backend.dto.BottleneckDTO;
import com.ehtp.kanban_backend.dto.CapacityDTO;
import com.ehtp.kanban_backend.dto.HealthDTO;
import com.ehtp.kanban_backend.dto.VelocityDTO;
import com.ehtp.kanban_backend.dto.VelocityTrendDTO;
import com.ehtp.kanban_backend.dto.WorkloadDTO;
import com.ehtp.kanban_backend.model.Projet;
import com.ehtp.kanban_backend.model.Sprint;
import com.ehtp.kanban_backend.model.SprintMetricSnapshot;
import com.ehtp.kanban_backend.model.Task;
import com.ehtp.kanban_backend.model.User;
import com.ehtp.kanban_backend.repository.ProjetRepository;
import com.ehtp.kanban_backend.repository.SprintMetricSnapshotRepository;
import com.ehtp.kanban_backend.repository.SprintRepository;
import com.ehtp.kanban_backend.repository.TaskRepository;
import com.ehtp.kanban_backend.service.factory.MetricCalculatorFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class MetricsService {
    private final SprintRepository sprintRepository;
    private final ProjetRepository projetRepository;
    private final TaskRepository taskRepository;
    private final SprintMetricSnapshotRepository snapshotRepository;
    private final MetricFormulaCalculator calculator;
    private final int reviewThresholdHours;

    public MetricsService(
            SprintRepository sprintRepository,
            ProjetRepository projetRepository,
            TaskRepository taskRepository,
            SprintMetricSnapshotRepository snapshotRepository,
            MetricFormulaCalculator calculator,
            @Value("${app.metrics.review-threshold-hours:24}") int reviewThresholdHours
    ) {
        this.sprintRepository = sprintRepository;
        this.projetRepository = projetRepository;
        this.taskRepository = taskRepository;
        this.snapshotRepository = snapshotRepository;
        this.calculator = calculator;
        this.reviewThresholdHours = reviewThresholdHours;
    }

    public CapacityDTO getCapacity(Long sprintId) {
        Sprint sprint = getSprint(sprintId);
        int planned = sprint.getPointsPlanned() == null ? 0 : sprint.getPointsPlanned();

        List<Task> tasks = taskRepository.findBySprintSprintId(sprintId);
        Map<Long, User> users = new LinkedHashMap<>();
        if (sprint.getProject() != null && sprint.getProject().getMembers() != null) {
            for (User member : sprint.getProject().getMembers()) {
                users.put(member.getId(), member);
            }
        }
        for (Task task : tasks) {
            if (task.getAssignee() != null) {
                users.put(task.getAssignee().getId(), task.getAssignee());
            }
        }

        int totalCapacity = users.values().stream()
                .map(User::getCapacityPoints)
                .mapToInt(val -> val == null ? 0 : val)
                .sum();
        int remaining = totalCapacity - planned;
        return new CapacityDTO(planned, totalCapacity, remaining, planned > totalCapacity);
    }

    @SuppressWarnings("unchecked")
    public VelocityDTO getVelocity(Long sprintId) {
        Sprint sprint = getSprint(sprintId);
        List<Task> tasks = taskRepository.findBySprintSprintId(sprintId);
        return (VelocityDTO) MetricCalculatorFactory.getCalculator("velocity").calculate(sprint, tasks, calculator);
    }

    @SuppressWarnings("unchecked")
    public List<WorkloadDTO> getWorkload(Long sprintId) {
        Sprint sprint = getSprint(sprintId);
        List<Task> tasks = taskRepository.findBySprintSprintId(sprintId);
        return (List<WorkloadDTO>) MetricCalculatorFactory.getCalculator("workload").calculate(sprint, tasks, calculator);
    }

    public List<BottleneckDTO> getBottlenecks(Long sprintId) {
        getSprint(sprintId);
        LocalDateTime now = LocalDateTime.now();
        return taskRepository.findBySprintSprintIdAndStatus(sprintId, Task.TaskStatus.IN_PROGRESS).stream()
                .map(task -> toBottleneck(task, now))
                .filter(bottleneck -> bottleneck.hoursInCurrentStatus() >= reviewThresholdHours)
                .toList();
    }

    public HealthDTO getHealth(Long sprintId) {
        Sprint sprint = getSprint(sprintId);
        List<Task> tasks = taskRepository.findBySprintSprintId(sprintId);
        HealthDTO health = (HealthDTO) MetricCalculatorFactory.getCalculator("health").calculate(sprint, tasks, calculator);

        VelocityDTO velocity = getVelocity(sprintId);
        saveSnapshot(sprintId, velocity, health.score());

        return health;
    }

    public List<VelocityTrendDTO> getVelocityTrend(Long projectId, int limit) {
        Projet project = projetRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
        int safeLimit = limit <= 0 ? 5 : limit;
        return sprintRepository.findByProjectIdOrderByEndDateDesc(project.getId()).stream()
                .limit(safeLimit)
                .map(sprint -> {
                    VelocityDTO velocity = getVelocity(sprint.getSprintId());
                    return new VelocityTrendDTO(
                            sprint.getSprintId(),
                            sprint.getObjective(),
                            sprint.getEndDate(),
                            velocity.plannedPoints(),
                            velocity.completedPoints(),
                            velocity.velocityRatio()
                    );
                })
                .sorted(Comparator.comparing(VelocityTrendDTO::endDate))
                .toList();
    }

    public Map<String, Object> getProjectMetrics(Long projectId) {
        Projet project = projetRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        List<Task> allTasks = taskRepository.findBySprintProjectId(projectId);
        long todoCount = allTasks.stream().filter(t -> t.getStatus() == Task.TaskStatus.TODO).count();
        long inProgressCount = allTasks.stream().filter(t -> t.getStatus() == Task.TaskStatus.IN_PROGRESS).count();
        long doneCount = allTasks.stream().filter(t -> t.getStatus() == Task.TaskStatus.DONE).count();

        Map<String, Long> completionRatios = new LinkedHashMap<>();
        completionRatios.put("TODO", todoCount);
        completionRatios.put("IN_PROGRESS", inProgressCount);
        completionRatios.put("DONE", doneCount);

        List<VelocityTrendDTO> velocityPatterns = getVelocityTrend(projectId, 5);

        Sprint activeSprint = sprintRepository.findByProjectIdAndIsActive(projectId, true).orElse(null);
        List<Map<String, Object>> burndown = new ArrayList<>();
        if (activeSprint != null) {
            List<Task> activeTasks = taskRepository.findBySprintSprintId(activeSprint.getSprintId());
            int totalPoints = activeTasks.stream()
                    .mapToInt(t -> t.getEffortPoints() == null ? 0 : t.getEffortPoints())
                    .sum();

            LocalDate start = activeSprint.getStartDate();
            LocalDate end = activeSprint.getEndDate();

            LocalDate current = start;
            while (!current.isAfter(end)) {
                LocalDate dateCopy = current;
                int completedOnOrBefore = activeTasks.stream()
                        .filter(t -> t.getStatus() == Task.TaskStatus.DONE)
                        .filter(t -> {
                            LocalDateTime changedAt = t.getStatusChangedAt() == null ? t.getUpdatedAt() : t.getStatusChangedAt();
                            return changedAt != null && !changedAt.toLocalDate().isAfter(dateCopy);
                        })
                        .mapToInt(t -> t.getEffortPoints() == null ? 0 : t.getEffortPoints())
                        .sum();

                Map<String, Object> point = new LinkedHashMap<>();
                point.put("day", dateCopy.toString());
                point.put("remainingPoints", Math.max(0, totalPoints - completedOnOrBefore));
                burndown.add(point);

                current = current.plusDays(1);
            }
        }

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("projectId", projectId);
        metrics.put("completionRatios", completionRatios);
        metrics.put("velocityPatterns", velocityPatterns);
        metrics.put("burndownPoints", burndown);
        return metrics;
    }

    private Sprint getSprint(Long sprintId) {
        return sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint not found"));
    }

    private BottleneckDTO toBottleneck(Task task, LocalDateTime now) {
        LocalDateTime changedAt = task.getStatusChangedAt() == null ? task.getUpdatedAt() : task.getStatusChangedAt();
        double hours = changedAt == null ? 0.0 : Duration.between(changedAt, now).toMinutes() / 60.0;
        return new BottleneckDTO(task.getId(), task.getTitle(), task.getStatus(), round(hours), reviewThresholdHours);
    }

    private void saveSnapshot(Long sprintId, VelocityDTO velocity, int score) {
        SprintMetricSnapshot snapshot = new SprintMetricSnapshot();
        snapshot.setSprintId(sprintId);
        snapshot.setPlannedPoints(velocity.plannedPoints());
        snapshot.setCompletedPoints(velocity.completedPoints());
        snapshot.setVelocityRatio(velocity.velocityRatio());
        snapshot.setHealthScore(score);
        snapshot.setCreatedAt(LocalDateTime.now());
        snapshotRepository.save(snapshot);
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
