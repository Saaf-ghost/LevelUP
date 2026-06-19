package com.ehtp.kanban_backend.model;

import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;

import java.time.LocalDateTime;

@MappedSuperclass// Do not create a table for this class. Instead, take its columns (createdAt, updatedAt) and inject them into any other table that inherits from it
public abstract class BaseAudit {
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist//Right before you run the SQL INSERT command to save this data for the very first time, run this method
    public void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate//Right before you run an SQL UPDATE command to modify existing data, run this method
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
