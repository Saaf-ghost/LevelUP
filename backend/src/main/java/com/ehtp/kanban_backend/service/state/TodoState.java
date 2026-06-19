package com.ehtp.kanban_backend.service.state;

import com.ehtp.kanban_backend.model.Task;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class TodoState implements TaskState {
    @Override
    public void transitionTo(Task task, Task.TaskStatus nextStatus) {
        if (nextStatus != Task.TaskStatus.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Invalid transition: TODO tasks can only transition to IN_PROGRESS");
        }
    }
}
