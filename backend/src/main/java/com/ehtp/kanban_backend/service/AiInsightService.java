package com.ehtp.kanban_backend.service;

import com.ehtp.kanban_backend.dto.AiCallbackRequestDTO;
import com.ehtp.kanban_backend.dto.AiRiskIngestionDTO;
import com.ehtp.kanban_backend.model.AiInsight;
import com.ehtp.kanban_backend.model.Projet;
import com.ehtp.kanban_backend.model.Sprint;
import com.ehtp.kanban_backend.repository.AiInsightRepository;
import com.ehtp.kanban_backend.repository.ProjetRepository;
import com.ehtp.kanban_backend.repository.SprintRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AiInsightService {
    private final AiInsightRepository aiInsightRepository;
    private final SprintRepository sprintRepository;
    private final ProjetRepository projetRepository;
    private final ObjectMapper objectMapper;

    public AiInsightService(
            AiInsightRepository aiInsightRepository, 
            SprintRepository sprintRepository,
            ProjetRepository projetRepository,
            ObjectMapper objectMapper
    ) {
        this.aiInsightRepository = aiInsightRepository;
        this.sprintRepository = sprintRepository;
        this.projetRepository = projetRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void processCallback(AiCallbackRequestDTO dto) {
        if (dto.getSprintId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sprintId is required");
        }
        Sprint sprint = sprintRepository.findById(dto.getSprintId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint not found"));

        // Clear existing insights for this sprint to refresh
        List<AiInsight> existing = aiInsightRepository.findBySprintSprintId(sprint.getSprintId());
        aiInsightRepository.deleteAll(existing);

        // Save new insights
        if (dto.getPredictiveRisk() != null && !dto.getPredictiveRisk().isBlank()) {
            saveInsight(dto.getPredictiveRisk(), AiInsight.InsightType.RISK_ALERT, sprint);
        }
        if (dto.getReassignmentSuggestions() != null && !dto.getReassignmentSuggestions().isBlank()) {
            saveInsight(dto.getReassignmentSuggestions(), AiInsight.InsightType.REASSIGNMENT_SUGGESTION, sprint);
        }
        if (dto.getHistoricalPatterns() != null && !dto.getHistoricalPatterns().isBlank()) {
            saveInsight(dto.getHistoricalPatterns(), AiInsight.InsightType.PATTERN_ANALYSIS, sprint);
        }
    }

    @Transactional
    public AiInsight ingestProjectRiskInsight(Long projectId, AiRiskIngestionDTO dto) {
        Projet project = projetRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        AiInsight insight = new AiInsight();
        insight.setProject(project);
        insight.setSprintHealthScore(dto.getSprintHealthScore());
        insight.setRiskLevel(dto.getRiskLevel());
        insight.setAutomatedStandupSummary(dto.getAutomatedStandupSummary());
        insight.setExplanation(dto.getAutomatedStandupSummary());
        insight.setConfidenceScore(100);
        insight.setAcknowledged(false);

        // Map alerts to string
        try {
            insight.setBottlenecksJson(objectMapper.writeValueAsString(dto.getBottleneckAlerts()));
        } catch (Exception e) {
            insight.setBottlenecksJson("[]");
        }

        return aiInsightRepository.save(insight);
    }

    public List<AiInsight> getInsightsBySprint(Long sprintId) {
        return aiInsightRepository.findBySprintSprintId(sprintId);
    }

    public List<AiInsight> getInsightsByProject(Long projectId) {
        return aiInsightRepository.findByProjectId(projectId);
    }

    private void saveInsight(String text, AiInsight.InsightType type, Sprint sprint) {
        AiInsight insight = new AiInsight();
        insight.setExplanation(text);
        insight.setInsightType(type);
        insight.setConfidenceScore(85);
        insight.setAcknowledged(false);
        insight.setSprint(sprint);
        insight.setProject(sprint.getProject());
        aiInsightRepository.save(insight);
    }
}
