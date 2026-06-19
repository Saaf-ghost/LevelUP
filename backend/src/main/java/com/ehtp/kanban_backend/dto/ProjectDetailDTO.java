package com.ehtp.kanban_backend.dto;

import com.ehtp.kanban_backend.dto.UserDTO;
import com.ehtp.kanban_backend.model.Projet;
import com.ehtp.kanban_backend.model.Sprint;
import com.ehtp.kanban_backend.model.Task;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ProjectDetailDTO {
    private Projet project;
    private Sprint activeSprint;
    private List<Task> activeSprintTasks;
    private List<UserDTO> members;
}
