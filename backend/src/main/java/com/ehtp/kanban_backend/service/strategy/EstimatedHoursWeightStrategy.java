package com.ehtp.kanban_backend.service.strategy;

import com.ehtp.kanban_backend.model.Task;

public class EstimatedHoursWeightStrategy implements TaskWeightStrategy {
    private static final double HOURS_PER_POINT = 8.0;

    @Override
    public double calculateWeight(Task task) {
        if (task == null || task.getEstimatedHours() == null) {
            return 0.0;
        }
        // Normalize hours: e.g., 8 hours = 1 effort point
        return task.getEstimatedHours() / HOURS_PER_POINT;
    }
}
