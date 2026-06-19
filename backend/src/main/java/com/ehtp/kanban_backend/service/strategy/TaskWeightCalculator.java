package com.ehtp.kanban_backend.service.strategy;

import com.ehtp.kanban_backend.model.Task;
import org.springframework.stereotype.Component;

@Component
public class TaskWeightCalculator {
    private TaskWeightStrategy strategy = new StoryPointsWeightStrategy(); // Default Strategy

    public void setStrategy(TaskWeightStrategy strategy) {
        this.strategy = strategy;
    }

    public double getWeight(Task task) {
        return strategy.calculateWeight(task);
    }
}
