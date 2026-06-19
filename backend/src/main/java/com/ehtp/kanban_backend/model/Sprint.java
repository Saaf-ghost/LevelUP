package com.ehtp.kanban_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sprints")
@Data
@EqualsAndHashCode(callSuper = false)
public class Sprint extends BaseAudit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private long sprintId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String objective;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "planned_points", nullable = false)
    private Integer plannedPoints = 0;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = false;

    @Column(name = "is_concluded", nullable = false)
    private Boolean isConcluded = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "sprint_status", nullable = false)
    private SprintStatus sprintStatus = SprintStatus.PLANNED;

    public enum SprintStatus { PLANNED, ACTIVE, DONE }

    @JsonIgnoreProperties({"sprints", "members", "owner"})
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Projet project;

    @JsonIgnoreProperties("sprint")
    @OneToMany(mappedBy = "sprint", cascade = CascadeType.ALL)
    private List<Requirement> requirements = new ArrayList<>();

    @JsonIgnoreProperties("sprint")
    @OneToMany(mappedBy = "sprint", cascade = CascadeType.ALL)
    private List<Task> tasks = new ArrayList<>();

    @JsonIgnoreProperties("sprint")
    @OneToMany(mappedBy = "sprint", cascade = CascadeType.ALL)
    private List<AiInsight> aiInsights = new ArrayList<>();

    public Sprint() {}

    public void setSprintStatus(SprintStatus sprintStatus) {
        this.sprintStatus = sprintStatus;
        this.isActive = (sprintStatus == SprintStatus.ACTIVE);
        this.isConcluded = (sprintStatus == SprintStatus.DONE);
    }

    public Integer getPointsPlanned() {
        return plannedPoints;
    }

    public void setPointsPlanned(Integer pointsPlanned) {
        this.plannedPoints = pointsPlanned;
    }
}
