package com.ehtp.kanban_backend.service.state;

import com.ehtp.kanban_backend.model.Task;

public interface TaskState {
    void transitionTo(Task task, Task.TaskStatus nextStatus);
}
