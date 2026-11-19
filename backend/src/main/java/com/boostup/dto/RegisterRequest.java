package com.boostup.dto;

import lombok.Data;

/**
 * Registration payload. The platform role is never taken from the client:
 * every self-service registration creates a regular USER. Platform
 * administrators are provisioned by the developer, never by signing up.
 */
@Data
public class RegisterRequest {
    private String email;
    private String password;
    private String fullName;
    private String firstName;
    private String lastName;
    private Integer capacityPoints;
}
