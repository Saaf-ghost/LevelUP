package com.boostup.dto;

import lombok.Data;

@Data
public class RequirementRequestDTO {
    private String title;
    private String description;
    private String color;
    private Long sprintId;
}
