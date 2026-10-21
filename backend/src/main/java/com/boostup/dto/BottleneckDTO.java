package com.boostup.dto;

import com.boostup.model.Task;

public record BottleneckDTO(
        Long taskId,
        String title,
        Task.TaskStatus status,
        Double hoursInCurrentStatus,
        Integer thresholdHours
) {
}
