package com.boostup.controller;

import com.boostup.dto.SprintRequestDTO;
import com.boostup.model.Sprint;
import com.boostup.service.SprintService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sprints")
public class SprintController {

    private final SprintService sprintService;

    public SprintController(SprintService sprintService) {
        this.sprintService = sprintService;
    }

    @PostMapping
    @PreAuthorize("@projectSecurity.isMember(#dto.projectId)")
    public Sprint createSprint(@RequestBody SprintRequestDTO dto) {
        return sprintService.createSprint(dto);
    }

    @GetMapping
    public List<Sprint> getAllSprints() {
        return sprintService.getAllSprints();
    }

    @GetMapping("/{id}")
    @PreAuthorize("@projectSecurity.isSprintMember(#id)")
    public Sprint getSprintById(@PathVariable Long id) {
        return sprintService.getSprintById(id);
    }

    @GetMapping("/project/{projectId}")
    @PreAuthorize("@projectSecurity.isMember(#projectId)")
    public List<Sprint> getSprintsByProject(@PathVariable Long projectId) {
        return sprintService.getSprintsByProject(projectId);
    }

    @PutMapping("/{id}")
    @PreAuthorize("@projectSecurity.isSprintOwner(#id)")
    public Sprint updateSprint(@PathVariable Long id, @RequestBody SprintRequestDTO dto) {
        return sprintService.updateSprint(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@projectSecurity.isSprintOwner(#id)")
    public void deleteSprint(@PathVariable Long id) {
        sprintService.deleteSprint(id);
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("@projectSecurity.isSprintMember(#id)")
    public Sprint completeSprint(@PathVariable Long id) {
        return sprintService.completeSprint(id);
    }
}
