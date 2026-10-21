package com.boostup.dto;

import com.boostup.model.Task;
import lombok.Data;

@Data
public class TaskStatusUpdateDTO {
    private Task.TaskStatus status;
}
