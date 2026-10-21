package com.boostup.dto;

public record HealthDTO(
        Integer score,
        String statusLabel,
        HealthComponentDTO components,
        String explanation
) {
}
