package com.ehtp.kanban_backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class SprintMetricSnapshot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long sprintId;

    @Column(nullable = false)
    private Integer plannedPoints;

    @Column(nullable = false)
    private Integer completedPoints;

    @Column(nullable = false)
    private Double velocityRatio;

    @Column(nullable = false)
    private Integer healthScore;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
