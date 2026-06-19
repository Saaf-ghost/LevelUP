package com.ehtp.kanban_backend.service;

import com.ehtp.kanban_backend.dto.DecisionNoteRequestDTO;
import com.ehtp.kanban_backend.model.DecisionNote;
import com.ehtp.kanban_backend.model.Task;
import com.ehtp.kanban_backend.model.User;
import com.ehtp.kanban_backend.repository.DecisionNoteRepository;
import com.ehtp.kanban_backend.repository.TaskRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class DecisionNoteService {
    private final DecisionNoteRepository decisionNoteRepository;
    private final TaskRepository taskRepository;
    private final AuthorizationService authorizationService;

    public DecisionNoteService(
            DecisionNoteRepository decisionNoteRepository,
            TaskRepository taskRepository,
            AuthorizationService authorizationService
    ) {
        this.decisionNoteRepository = decisionNoteRepository;
        this.taskRepository = taskRepository;
        this.authorizationService = authorizationService;
    }

    public DecisionNote createDecisionNote(Long taskId, DecisionNoteRequestDTO dto) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
        User user = authorizationService.requireProjectEditor(task.getSprint().getProject());
        validateDecisionNoteRequest(dto);

        DecisionNote note = new DecisionNote();
        note.setTask(task);
        note.setUser(user);
        note.setWhat(dto.getWhat().trim());
        note.setWhy(dto.getWhy().trim());
        return decisionNoteRepository.save(note);
    }

    public List<DecisionNote> getDecisionNotes(Long taskId) {
        taskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
        return decisionNoteRepository.findByTaskId(taskId);
    }

    private void validateDecisionNoteRequest(DecisionNoteRequestDTO dto) {
        if (dto.getWhat() == null || dto.getWhat().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "what is required");
        }
        if (dto.getWhy() == null || dto.getWhy().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "why is required");
        }
    }
}
