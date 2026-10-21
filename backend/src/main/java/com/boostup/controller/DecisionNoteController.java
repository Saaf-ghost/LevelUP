package com.boostup.controller;

import com.boostup.dto.DecisionNoteRequestDTO;
import com.boostup.model.DecisionNote;
import com.boostup.service.DecisionNoteService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks/{taskId}/decision-notes")
public class DecisionNoteController {
    private final DecisionNoteService decisionNoteService;

    public DecisionNoteController(DecisionNoteService decisionNoteService) {
        this.decisionNoteService = decisionNoteService;
    }

    @PostMapping
    public DecisionNote createDecisionNote(
            @PathVariable Long taskId,
            @RequestBody DecisionNoteRequestDTO dto
    ) {
        return decisionNoteService.createDecisionNote(taskId, dto);
    }

    @GetMapping
    public List<DecisionNote> getDecisionNotes(@PathVariable Long taskId) {
        return decisionNoteService.getDecisionNotes(taskId);
    }
}
