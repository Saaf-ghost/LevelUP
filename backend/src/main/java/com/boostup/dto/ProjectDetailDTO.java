package com.boostup.dto;

import com.boostup.model.Projet;
import com.boostup.model.Sprint;
import com.boostup.model.Task;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ProjectDetailDTO {
    private Projet project;
    private Sprint activeSprint;
    private List<Task> activeSprintTasks;
    private List<MemberDTO> members;
}
