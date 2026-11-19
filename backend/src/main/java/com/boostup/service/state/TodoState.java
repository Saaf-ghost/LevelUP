package com.boostup.service.state;

import com.boostup.model.Task;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class TodoState implements TaskState {
    @Override
    public void transitionTo(Task task, Task.TaskStatus nextStatus) {
        // The board is free-form: work can be started or completed directly.
        if (nextStatus != Task.TaskStatus.IN_PROGRESS && nextStatus != Task.TaskStatus.DONE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid transition: TODO tasks can only transition to IN_PROGRESS or DONE");
        }
    }
}
