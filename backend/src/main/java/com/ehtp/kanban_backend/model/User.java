package com.ehtp.kanban_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_email", columnList = "email", unique = true)
})
@Data
@EqualsAndHashCode(callSuper = false)
public class User extends BaseAudit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    @JsonIgnore
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    public enum Role { OWNER, MEMBER, VIEWER }

    @Column(nullable = false)
    private Integer capacityPoints = 40;

    @Column(columnDefinition = "TEXT")
    private String skills;

    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Projet> ownedProjects = new ArrayList<>();

    @ManyToMany(mappedBy = "members")
    @JsonIgnore
    private List<Projet> memberProjects = new ArrayList<>();

    public User() {}

    public User(String email, String fullName, String passwordHash, Role role, Integer capacityPoints) {
        this.email = email;
        this.fullName = fullName;
        this.name = fullName;
        this.passwordHash = passwordHash;
        this.role = role;
        this.capacityPoints = capacityPoints;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
        this.name = fullName;
    }

    public void setName(String name) {
        this.name = name;
        this.fullName = name;
    }
}
