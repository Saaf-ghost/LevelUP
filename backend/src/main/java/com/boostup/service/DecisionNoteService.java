package com.boostup.service;

import com.boostup.dto.DecisionNoteRequestDTO;
import com.boostup.model.DecisionNote;
import com.boostup.model.Projet;
import com.boostup.model.Task;
import com.boostup.model.User;
import com.boostup.repository.DecisionNoteRepository;
import com.boostup.repository.TaskRepository;
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
        User user = authorizationService.requireProjectEditor(projectOf(task));
        validateDecisionNoteRequest(dto);

        DecisionNote note = new DecisionNote();
        note.setTask(task);
        note.setUser(user);
        note.setWhat(dto.getWhat().trim());
        note.setWhy(dto.getWhy().trim());
        return decisionNoteRepository.save(note);
    }

    public List<DecisionNote> getDecisionNotes(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
        authorizationService.requireProjectViewer(projectOf(task));
        return decisionNoteRepository.findByTaskId(taskId);
    }

    private Projet projectOf(Task task) {
        Projet project = task.getRequirement() == null ? null : task.getRequirement().getProject();
        if (project == null && task.getSprint() != null) {
            project = task.getSprint().getProject();
        }
        if (project == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Task is not attached to a project");
        }
        return project;
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
