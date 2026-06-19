package com.ehtp.kanban_backend.dto;

import java.util.List;

public record ReassignmentSuggestionsDTO(
        List<SuggestedReassignmentDTO> suggestedReassignments,
        String rationale,
        Integer estimatedImpactOnHealthScore
) {
}
