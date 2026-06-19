package com.ehtp.kanban_backend.service.state;

import com.ehtp.kanban_backend.model.Task;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class DoneState implements TaskState {
    @Override
    public void transitionTo(Task task, Task.TaskStatus nextStatus) {
        // Business rule: locked down once DONE
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Business Rule Locked: DONE tasks cannot be transitioned to any other state.");
    }
}
