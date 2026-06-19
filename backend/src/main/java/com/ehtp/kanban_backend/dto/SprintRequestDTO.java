package com.ehtp.kanban_backend.dto;

import com.ehtp.kanban_backend.model.Sprint;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class SprintRequestDTO {
    private String objective;
    private String sprintObjective;
    private LocalDate startDate;
    private LocalDate endDate;
    private Sprint.SprintStatus sprintStatus;
    private Integer pointsPlanned;
    private Integer plannedStoryPoints;
    private Long projectId;
    private List<Long> requirementIds;

    public String getObjective() {
        return sprintObjective != null ? sprintObjective : objective;
    }

    public Integer getPointsPlanned() {
        return plannedStoryPoints != null ? plannedStoryPoints : pointsPlanned;
    }
}