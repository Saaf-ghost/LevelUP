package com.ehtp.kanban_backend.dto;

import java.util.List;

public record SprintRetrospectiveDTO(
        List<String> patterns,
        String conclusion,
        String recommendation
) {
}
