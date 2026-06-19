package com.ehtp.kanban_backend.dto;

public record HealthDTO(
        Integer score,
        String statusLabel,
        HealthComponentDTO components,
        String explanation
) {
}
