package com.ehtp.kanban_backend.service.state;

import com.ehtp.kanban_backend.model.Task;

public class TaskStateFactory {
    public static TaskState getState(Task.TaskStatus status) {
        if (status == null) {
            return new TodoState(); // Default
        }
        switch (status) {
            case TODO:
                return new TodoState();
            case IN_PROGRESS:
                return new InProgressState();
            case DONE:
                return new DoneState();
            default:
                throw new IllegalArgumentException("Unknown task status: " + status);
        }
    }
}
