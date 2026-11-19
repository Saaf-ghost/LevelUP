package com.boostup.dto;

import lombok.Data;

/**
 * Registration payload. The platform role is never taken from the client:
 * new accounts are created as USER (the very first account bootstraps
 * the platform ADMINISTRATOR).
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
