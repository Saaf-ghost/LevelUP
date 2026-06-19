package com.ehtp.kanban_backend.dto;

import lombok.Data;

@Data
public class DecisionNoteRequestDTO {
    private String what;
    private String why;
    private Long decidedByUserId;
}
