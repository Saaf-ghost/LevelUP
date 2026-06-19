package com.ehtp.kanban_backend.dto;

import com.ehtp.kanban_backend.model.Task;
import lombok.Data;

@Data
public class TaskStatusUpdateDTO {
    private Task.TaskStatus status;
}
