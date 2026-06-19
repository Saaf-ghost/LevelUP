package com.ehtp.kanban_backend.dto;

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
