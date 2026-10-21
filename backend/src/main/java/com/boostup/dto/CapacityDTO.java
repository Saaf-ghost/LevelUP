package com.boostup.dto;

public record CapacityDTO(
        Integer plannedPoints,
        Integer totalCapacityPoints,
        Integer remainingCapacity,
        boolean overloaded
) {
}
