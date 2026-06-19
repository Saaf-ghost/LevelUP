package com.ehtp.kanban_backend.dto;

import com.ehtp.kanban_backend.model.User;

public record UserDTO(
        Long id,
        String email,
        String fullName,
        User.Role role,
        Integer capacityPoints
) {
    public static UserDTO from(User user) {
        return new UserDTO(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getCapacityPoints()
        );
    }
}
