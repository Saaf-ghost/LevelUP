package com.boostup.service.state;

import com.boostup.model.Task;

public interface TaskState {
    void transitionTo(Task task, Task.TaskStatus nextStatus);
}
