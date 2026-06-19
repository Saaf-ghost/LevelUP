package com.ehtp.kanban_backend.dto;

public record CapacityDTO(
        Integer plannedPoints,
        Integer totalCapacityPoints,
        Integer remainingCapacity,
        boolean overloaded
) {
}
