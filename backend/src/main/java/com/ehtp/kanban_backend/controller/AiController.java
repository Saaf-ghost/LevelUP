package com.ehtp.kanban_backend.controller;

import com.ehtp.kanban_backend.dto.AiCallbackRequestDTO;
import com.ehtp.kanban_backend.model.AiInsight;
import com.ehtp.kanban_backend.service.AiInsightService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
public class AiController {
    private final AiInsightService aiInsightService;

    public AiController(AiInsightService aiInsightService) {
        this.aiInsightService = aiInsightService;
    }

    @PostMapping("/callback")
    public void receiveCallback(@RequestBody AiCallbackRequestDTO dto) {
        aiInsightService.processCallback(dto);
    }

    @GetMapping("/sprint/{sprintId}")
    public List<AiInsight> getInsightsBySprint(@PathVariable Long sprintId) {
        return aiInsightService.getInsightsBySprint(sprintId);
    }
}
