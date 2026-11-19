package com.boostup.controller;

import com.boostup.dto.UserDTO;
import com.boostup.service.AdminService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

/**
 * Platform administration. Every endpoint requires the platform ADMINISTRATOR role.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMINISTRATOR')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public List<UserDTO> listUsers() {
        return adminService.listUsers();
    }

    @PutMapping("/users/{id}/role")
    public UserDTO updateRole(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String role = payload.get("role");
        if (role == null || role.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "role is required");
        }
        return adminService.updatePlatformRole(id, role);
    }
}
