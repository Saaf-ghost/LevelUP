package com.boostup.dto;

import com.boostup.model.ProjectRole;
import com.boostup.model.User;

/**
 * A project member together with the role they hold inside that project.
 */
public record MemberDTO(
        Long id,
        String email,
        String fullName,
        ProjectRole role,
        Integer capacityPoints
) {
    public static MemberDTO from(User user, ProjectRole role) {
        return new MemberDTO(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                role,
                user.getCapacityPoints()
        );
    }
}
