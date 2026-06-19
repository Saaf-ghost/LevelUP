package com.ehtp.kanban_backend.dto;

import lombok.Data;

@Data
public class RequirementRequestDTO {
    private String title;
    private String description;
    private String color;
    private Long sprintId;
}
