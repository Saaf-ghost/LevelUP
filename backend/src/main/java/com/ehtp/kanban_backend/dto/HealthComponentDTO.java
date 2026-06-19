package com.ehtp.kanban_backend.dto;

public record HealthComponentDTO(
        Double velocity,
        Double workloadBalance,
        Double timing
) {
}
