package com.ehtp.kanban_backend.service.strategy;

import com.ehtp.kanban_backend.model.Task;

public class StoryPointsWeightStrategy implements TaskWeightStrategy {
    @Override
    public double calculateWeight(Task task) {
        if (task == null || task.getEffortPoints() == null) {
            return 0.0;
        }
        return task.getEffortPoints();
    }
}
