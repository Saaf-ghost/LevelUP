package com.boostup.dto;

public record WorkloadDTO(
        Long userId,
        String fullName,
        Integer assignedPoints,
        Integer completedPoints,
        Integer remainingPoints,
        Integer capacityPoints,
        Double loadRatio,
        boolean overCapacity,
        boolean over120Percent
) {
}
