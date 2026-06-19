package com.ehtp.kanban_backend.dto;

import com.ehtp.kanban_backend.model.Task;

public record BottleneckDTO(
        Long taskId,
        String title,
        Task.TaskStatus status,
        Double hoursInCurrentStatus,
        Integer thresholdHours
) {
}
