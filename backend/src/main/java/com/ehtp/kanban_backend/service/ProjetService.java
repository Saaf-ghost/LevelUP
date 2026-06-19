package com.ehtp.kanban_backend.service;

import com.ehtp.kanban_backend.dto.DigestResponseDTO;
import com.ehtp.kanban_backend.dto.ProjectDetailDTO;
import com.ehtp.kanban_backend.dto.ProjectRequestDTO;
import com.ehtp.kanban_backend.dto.UserDTO;
import com.ehtp.kanban_backend.model.Projet;
import com.ehtp.kanban_backend.model.Sprint;
import com.ehtp.kanban_backend.model.Task;
import com.ehtp.kanban_backend.model.User;
import com.ehtp.kanban_backend.repository.ProjetRepository;
import com.ehtp.kanban_backend.repository.SprintRepository;
import com.ehtp.kanban_backend.repository.TaskRepository;
import com.ehtp.kanban_backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ProjetService {

    private final ProjetRepository projetRepository;
    private final SprintRepository sprintRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final AuthorizationService authorizationService;

    public ProjetService(
            ProjetRepository projetRepository,
            SprintRepository sprintRepository,
            TaskRepository taskRepository,
            UserRepository userRepository,
            AuthorizationService authorizationService
    ) {
        this.projetRepository = projetRepository;
        this.sprintRepository = sprintRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.authorizationService = authorizationService;
    }

    public Projet createProjet(ProjectRequestDTO dto) {
        User creator = authorizationService.currentUser();
        Projet projet = new Projet();
        projet.setOwner(creator);
        if (projet.getMembers() == null) {
            projet.setMembers(new ArrayList<>());
        }
        projet.getMembers().add(creator);
        applyProjectFields(projet, dto);
        return projetRepository.save(projet);
    }

    public List<Projet> getAllProjets() {
        User user = authorizationService.currentUser();
        return projetRepository.findDistinctByOwnerIdOrMembersId(user.getId(), user.getId());
    }

    public Projet getProjetById(Long id) {
        return projetRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projet not found"));
    }

    public Projet updateProjet(Long id, ProjectRequestDTO updatedProjet) {
        Projet projet = getProjetById(id);
        User currentUser = authorizationService.currentUser();
        if (projet.getOwner().getId() != currentUser.getId()) {
            throw new org.springframework.security.access.AccessDeniedException("User is not the owner of this project");
        }

        applyProjectFields(projet, updatedProjet);

        return projetRepository.save(projet);
    }

    public void deleteProjet(Long id) {
        Projet projet = getProjetById(id);
        User currentUser = authorizationService.currentUser();
        if (projet.getOwner().getId() != currentUser.getId()) {
            throw new org.springframework.security.access.AccessDeniedException("User is not the owner of this project");
        }
        projetRepository.delete(projet);
    }

    public ProjectDetailDTO getProjectDetail(Long id) {
        Projet project = getProjetById(id);
        Sprint activeSprint = sprintRepository.findByProjectIdAndIsActive(id, true)
                .orElse(null);
        List<Task> tasks = activeSprint == null ? List.of() : taskRepository.findBySprintSprintId(activeSprint.getSprintId());
        List<UserDTO> memberDTOs = project.getMembers().stream().map(UserDTO::from).toList();
        return new ProjectDetailDTO(project, activeSprint, tasks, memberDTOs);
    }

    public Projet inviteMember(Long projectId, String email) {
        Projet project = getProjetById(projectId);
        User currentUser = authorizationService.currentUser();
        if (project.getOwner().getId() != currentUser.getId()) {
            throw new org.springframework.security.access.AccessDeniedException("User is not the owner of this project");
        }

        User invitee = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User with email " + email + " not found"));

        if (!project.getMembers().contains(invitee)) {
            project.getMembers().add(invitee);
        }

        return projetRepository.save(project);
    }

    public DigestResponseDTO getDigest(Long projectId, int hours) {
        getProjetById(projectId);
        int safeHours = hours <= 0 ? 24 : hours;
        LocalDateTime since = LocalDateTime.now().minusHours(safeHours);
        List<Task> changedTasks = taskRepository.findBySprintProjectIdAndUpdatedAtAfter(projectId, since);
        List<String> highlights = new ArrayList<>();

        for (Task task : changedTasks) {
            String assignee = task.getAssignee() == null ? "unassigned" : task.getAssignee().getFullName();
            highlights.add("Task '" + task.getTitle() + "' is " + task.getStatus() + " and assigned to " + assignee + ".");
        }

        String summary = changedTasks.isEmpty()
                ? "No task changes were detected in the last " + safeHours + " hours."
                : changedTasks.size() + " task change(s) were detected in the last " + safeHours + " hours.";

        return new DigestResponseDTO(projectId, since, changedTasks.size(), summary, highlights);
    }

    private void applyProjectFields(Projet projet, ProjectRequestDTO dto) {
        validateProjectRequest(dto);
        projet.setName(dto.getName().trim());
        projet.setDescription(dto.getDescription() == null ? "" : dto.getDescription().trim());
        projet.setStartDate(dto.getStartDate());
        projet.setEndDate(dto.getEndDate());
        projet.setStatus(dto.getStatus() == null ? Projet.ProjectStatus.PLANNED : dto.getStatus());
    }

    private void validateProjectRequest(ProjectRequestDTO dto) {
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }
        if (dto.getStartDate() == null || dto.getEndDate() == null || !dto.getStartDate().isBefore(dto.getEndDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startDate must be before endDate");
        }
    }
}
