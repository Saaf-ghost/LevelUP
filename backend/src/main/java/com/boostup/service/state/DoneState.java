package com.boostup.service.state;

import com.boostup.model.Task;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class DoneState implements TaskState {
    @Override
    public void transitionTo(Task task, Task.TaskStatus nextStatus) {
        // Reopening is allowed: completed work can be sent back to the board.
        if (nextStatus != Task.TaskStatus.TODO && nextStatus != Task.TaskStatus.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid transition: DONE tasks can only be reopened to TODO or IN_PROGRESS");
        }
    }
}
