package com.ehtp.kanban_backend.dto;

import lombok.Data;

@Data
public class AiCallbackRequestDTO {
    private Long sprintId;
    private String predictiveRisk;
    private String reassignmentSuggestions;
    private String historicalPatterns;
}
