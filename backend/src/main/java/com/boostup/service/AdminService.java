package com.boostup.service;

import com.boostup.dto.UserDTO;
import com.boostup.model.User;
import com.boostup.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;

    public AdminService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<UserDTO> listUsers() {
        return userRepository.findAll().stream().map(UserDTO::from).toList();
    }

    @Transactional
    public UserDTO updatePlatformRole(Long userId, String roleName) {
        User.Role target;
        try {
            target = User.Role.valueOf(roleName == null ? "" : roleName.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "role must be one of ADMINISTRATOR, USER");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole() == User.Role.ADMINISTRATOR && target != User.Role.ADMINISTRATOR) {
            long remainingAdmins = userRepository.findAll().stream()
                    .filter(candidate -> candidate.getRole() == User.Role.ADMINISTRATOR)
                    .count();
            if (remainingAdmins <= 1) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT, "At least one platform ADMINISTRATOR must remain");
            }
        }

        user.setRole(target);
        return UserDTO.from(userRepository.save(user));
    }
}
