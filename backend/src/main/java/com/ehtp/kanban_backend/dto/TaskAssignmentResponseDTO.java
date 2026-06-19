package com.ehtp.kanban_backend.dto;

import com.ehtp.kanban_backend.model.Task;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TaskAssignmentResponseDTO {
    private Task task;
    private boolean overAssigned;
    private int currentSprintWorkload;
    private int capacityPoints;
    private String warning;
}
