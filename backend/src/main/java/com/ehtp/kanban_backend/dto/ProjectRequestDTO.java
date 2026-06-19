package com.ehtp.kanban_backend.dto;

import com.ehtp.kanban_backend.model.Projet;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ProjectRequestDTO {
    private String name;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private Projet.ProjectStatus status;
}
