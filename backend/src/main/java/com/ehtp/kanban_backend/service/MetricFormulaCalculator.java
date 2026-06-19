package com.ehtp.kanban_backend.service;

import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MetricFormulaCalculator {
    public double velocityRatio(int completedPoints, int plannedPoints) {
        if (plannedPoints <= 0) {
            return 0.0;
        }
        return (double) completedPoints / plannedPoints;
    }

    public double velocityScore(double velocityRatio) {
        return clamp(velocityRatio * 100.0, 0.0, 100.0);
    }

    public double workloadBalanceScore(List<Double> loadRatios) {
        if (loadRatios.isEmpty()) {
            return 100.0;
        }
        return loadRatios.stream()
                .mapToDouble(this::singleWorkloadScore)
                .average()
                .orElse(100.0);
    }

    public double timingScore(int remainingPoints, int plannedPoints, long daysRemaining, long totalDays) {
        if (remainingPoints <= 0) {
            return 100.0;
        }
        if (plannedPoints <= 0 || totalDays <= 0) {
            return 0.0;
        }
        double expectedRemaining = plannedPoints * clamp((double) daysRemaining / totalDays, 0.0, 1.0);
        if (remainingPoints <= expectedRemaining) {
            return 100.0;
        }
        if (expectedRemaining <= 0.0) {
            return 0.0;
        }
        return clamp((expectedRemaining / remainingPoints) * 100.0, 0.0, 100.0);
    }

    public int healthScore(double velocityScore, double workloadScore, double timingScore) {
        return (int) Math.round((velocityScore * 0.4) + (workloadScore * 0.3) + (timingScore * 0.3));
    }

    private double singleWorkloadScore(double loadRatio) {
        if (loadRatio <= 1.0) {
            return 100.0;
        }
        if (loadRatio <= 1.2) {
            return 80.0;
        }
        return clamp(80.0 - ((loadRatio - 1.2) * 100.0), 0.0, 80.0);
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }
}
