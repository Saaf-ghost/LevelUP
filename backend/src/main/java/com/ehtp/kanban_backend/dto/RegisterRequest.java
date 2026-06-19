package com.ehtp.kanban_backend.dto;

import com.ehtp.kanban_backend.model.User;
import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String password;
    private String fullName;
    private String firstName;
    private String lastName;
    private User.Role role;
    private Integer capacityPoints;
}
