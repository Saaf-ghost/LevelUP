package com.ehtp.kanban_backend.service.factory;

import com.ehtp.kanban_backend.dto.HealthComponentDTO;
import com.ehtp.kanban_backend.dto.HealthDTO;
import com.ehtp.kanban_backend.dto.VelocityDTO;
import com.ehtp.kanban_backend.dto.WorkloadDTO;
import com.ehtp.kanban_backend.model.Sprint;
import com.ehtp.kanban_backend.model.Task;
import com.ehtp.kanban_backend.service.MetricFormulaCalculator;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

public class HealthCalculator implements MetricCalculator {
    @Override
    public HealthDTO calculate(Sprint sprint, List<Task> tasks, MetricFormulaCalculator formulaCalculator) {
        VelocityCalculator velocityCalc = new VelocityCalculator();
        VelocityDTO velocity = velocityCalc.calculate(sprint, tasks, formulaCalculator);

        WorkloadCalculator workloadCalc = new WorkloadCalculator();
        List<WorkloadDTO> workload = workloadCalc.calculate(sprint, tasks, formulaCalculator);

        int remainingPoints = tasks.stream()
                .filter(task -> task.getStatus() != Task.TaskStatus.DONE)
                .map(Task::getEffortPoints)
                .mapToInt(points -> points == null ? 0 : points)
                .sum();
        long totalDays = Math.max(1, ChronoUnit.DAYS.between(sprint.getStartDate(), sprint.getEndDate()) + 1);
        long daysRemaining = Math.max(0, ChronoUnit.DAYS.between(LocalDate.now(), sprint.getEndDate()) + 1);

        double velocityScore = formulaCalculator.velocityScore(velocity.velocityRatio());
        double workloadScore = formulaCalculator.workloadBalanceScore(
                workload.stream().map(WorkloadDTO::loadRatio).toList()
        );
        double timingScore = formulaCalculator.timingScore(remainingPoints, velocity.plannedPoints(), daysRemaining, totalDays);
        int score = formulaCalculator.healthScore(velocityScore, workloadScore, timingScore);

        return new HealthDTO(
                score,
                statusLabel(score),
                new HealthComponentDTO(round(velocityScore), round(workloadScore), round(timingScore)),
                "Health combines velocity (40%), workload balance (30%), and timing against remaining work (30%)."
        );
    }

    private String statusLabel(int score) {
        if (score >= 80) return "HEALTHY";
        if (score >= 50) return "AT_RISK";
        return "CRITICAL";
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
