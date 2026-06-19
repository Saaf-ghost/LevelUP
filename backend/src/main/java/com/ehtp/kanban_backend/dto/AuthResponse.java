package com.ehtp.kanban_backend.dto;

public record AuthResponse(String token, UserDTO user) {
}
