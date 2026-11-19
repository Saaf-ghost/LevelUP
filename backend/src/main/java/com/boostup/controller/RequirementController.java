package com.boostup.controller;

import com.boostup.dto.RequirementRequestDTO;
import com.boostup.dto.TaskRequestDTO;
import com.boostup.model.Requirement;
import com.boostup.model.Task;
import com.boostup.service.RequirementService;
import com.boostup.service.TaskService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requirements")
public class RequirementController {
    private final RequirementService requirementService;
    private final TaskService taskService;

    public RequirementController(RequirementService requirementService, TaskService taskService) {
        this.requirementService = requirementService;
        this.taskService = taskService;
    }

    @PostMapping
    public Requirement createRequirement(@RequestBody RequirementRequestDTO dto) {
        return requirementService.createRequirement(dto);
    }

    @GetMapping("/sprint/{sprintId}")
    @PreAuthorize("@projectSecurity.isSprintMember(#sprintId)")
    public List<Requirement> getRequirementsBySprint(@PathVariable Long sprintId) {
        return requirementService.getRequirementsBySprint(sprintId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("@projectSecurity.isRequirementMember(#id)")
    public Requirement getRequirementById(@PathVariable Long id) {
        return requirementService.getRequirementById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("@projectSecurity.isRequirementOwner(#id)")
    public Requirement updateRequirement(@PathVariable Long id, @RequestBody RequirementRequestDTO dto) {
        return requirementService.updateRequirement(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@projectSecurity.isRequirementOwner(#id)")
    public void deleteRequirement(@PathVariable Long id) {
        requirementService.deleteRequirement(id);
    }

    @PostMapping("/{requirementId}/subtasks")
    @PreAuthorize("@projectSecurity.isRequirementMember(#requirementId)")
    public Task createSubtask(@PathVariable Long requirementId, @RequestBody TaskRequestDTO dto) {
        return taskService.createSubtask(requirementId, dto);
    }
}
