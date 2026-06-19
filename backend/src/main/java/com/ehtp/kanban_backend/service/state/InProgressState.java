package com.ehtp.kanban_backend.service.state;

import com.ehtp.kanban_backend.model.Task;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class InProgressState implements TaskState {
    @Override
    public void transitionTo(Task task, Task.TaskStatus nextStatus) {
        if (nextStatus != Task.TaskStatus.TODO && nextStatus != Task.TaskStatus.DONE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Invalid transition: IN_PROGRESS tasks can only transition to TODO or DONE");
        }
    }
}
