package com.ehtp.kanban_backend.service.strategy;

import com.ehtp.kanban_backend.model.Task;

public interface TaskWeightStrategy {
    double calculateWeight(Task task);
}
