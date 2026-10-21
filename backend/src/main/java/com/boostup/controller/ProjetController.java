package com.boostup.controller;

import com.boostup.dto.DigestResponseDTO;
import com.boostup.dto.ProjectDetailDTO;
import com.boostup.dto.ProjectRequestDTO;
import com.boostup.dto.RequirementRequestDTO;
import com.boostup.dto.SprintRequestDTO;
import com.boostup.model.Projet;
import com.boostup.model.Requirement;
import com.boostup.model.Sprint;
import com.boostup.service.ProjetService;
import com.boostup.service.RequirementService;
import com.boostup.service.SprintService;
import com.boostup.service.MetricsService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
public class ProjetController {

    private final ProjetService projetService;
    private final RequirementService requirementService;
    private final SprintService sprintService;
    private final MetricsService metricsService;

    public ProjetController(
            ProjetService projetService,
            RequirementService requirementService,
            SprintService sprintService,
            MetricsService metricsService
    ) {
        this.projetService = projetService;
        this.requirementService = requirementService;
        this.sprintService = sprintService;
        this.metricsService = metricsService;
    }

    @PostMapping
    public Projet createProjet(@RequestBody ProjectRequestDTO projet) {
        return projetService.createProjet(projet);
    }

    @GetMapping
    public List<Projet> getAllProjets() {
        return projetService.getAllProjets();
    }

    @GetMapping("/{id}")
    @PreAuthorize("@projectSecurity.hasRole(#id, 'VIEWER')")
    public Projet getProjetById(@PathVariable Long id) {
        return projetService.getProjetById(id);
    }

    @GetMapping("/{id}/detail")
    @PreAuthorize("@projectSecurity.hasRole(#id, 'VIEWER')")
    public ProjectDetailDTO getProjectDetail(@PathVariable Long id) {
        return projetService.getProjectDetail(id);
    }

    @GetMapping("/{id}/digest")
    @PreAuthorize("@projectSecurity.hasRole(#id, 'VIEWER')")
    public DigestResponseDTO getProjectDigest(
            @PathVariable Long id,
            @RequestParam(defaultValue = "24") int hours
    ) {
        return projetService.getDigest(id, hours);
    }

    @PutMapping("/{id}")
    @PreAuthorize("@projectSecurity.hasRole(#id, 'MEMBER')")
    public Projet updateProjet(@PathVariable Long id, @RequestBody ProjectRequestDTO projet) {
        return projetService.updateProjet(id, projet);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@projectSecurity.hasRole(#id, 'OWNER')")
    public void deleteProjet(@PathVariable Long id) {
        projetService.deleteProjet(id);
    }

    @PostMapping("/{id}/members")
    @PreAuthorize("@projectSecurity.hasRole(#id, 'OWNER')")
    public Projet inviteMember(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email is required");
        }
        return projetService.inviteMember(id, email);
    }

    @GetMapping("/{id}/requirements")
    @PreAuthorize("@projectSecurity.hasRole(#id, 'VIEWER')")
    public List<Requirement> getRequirementsByProject(@PathVariable Long id) {
        return requirementService.getRequirementsByProject(id);
    }

    @PostMapping("/{id}/requirements")
    @PreAuthorize("@projectSecurity.hasRole(#id, 'OWNER')")
    public Requirement addRequirement(@PathVariable Long id, @RequestBody RequirementRequestDTO reqDto) {
        return requirementService.createRequirementForProject(id, reqDto);
    }

    @PostMapping("/{id}/sprints")
    @PreAuthorize("@projectSecurity.hasRole(#id, 'OWNER')")
    public Sprint createSprint(@PathVariable Long id, @RequestBody SprintRequestDTO sprintDto) {
        return sprintService.createSprintForProject(id, sprintDto);
    }

    @GetMapping("/{id}/metrics")
    @PreAuthorize("@projectSecurity.hasRole(#id, 'VIEWER')")
    public Map<String, Object> getProjectMetrics(@PathVariable Long id) {
        return metricsService.getProjectMetrics(id);
    }

}
