package com.ehtp.kanban_backend.dto;

public record SprintRiskDTO(
        String riskLevel,
        String explanation,
        String rootCause,
        String recommendedAction
) {
}
