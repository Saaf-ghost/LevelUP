package com.ehtp.kanban_backend.dto;

public record VelocityDTO(
        Integer plannedPoints,
        Integer completedPoints,
        Double velocityRatio
) {
}
