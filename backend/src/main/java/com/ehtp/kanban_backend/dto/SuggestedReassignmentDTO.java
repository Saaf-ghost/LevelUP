package com.ehtp.kanban_backend.dto;

public record SuggestedReassignmentDTO(
        Long taskId,
        String taskTitle,
        Long fromUserId,
        String fromUserName,
        Long toUserId,
        String toUserName,
        String rationale
) {
}
