package com.ehtp.kanban_backend.dto;

import java.time.LocalDate;

public record VelocityTrendDTO(
        Long sprintId,
        String sprintName,
        LocalDate endDate,
        Integer plannedPoints,
        Integer completedPoints,
        Double velocityRatio
) {
}
