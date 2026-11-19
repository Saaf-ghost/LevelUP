package com.boostup.controller;

import com.boostup.dto.TaskAssignmentDTO;
import com.boostup.dto.TaskAssignmentResponseDTO;
import com.boostup.dto.TaskRequestDTO;
import com.boostup.dto.TaskStatusUpdateDTO;
import com.boostup.model.Task;
import com.boostup.service.TaskService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    public Task createTask(@RequestBody TaskRequestDTO dto) {
        return taskService.createTask(dto);
    }

    @GetMapping
    public List<Task> getAllTasks(@RequestParam(required = false) Long sprintId) {
        if (sprintId != null) {
            return taskService.getTasksBySprint(sprintId);
        }
        return taskService.getAllTasks();
    }

    @GetMapping("/{id}")
    @PreAuthorize("@projectSecurity.isTaskMember(#id)")
    public Task getTaskById(@PathVariable Long id) {
        return taskService.getTaskById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("@projectSecurity.isTaskMember(#id)")
    public Task updateTask(@PathVariable Long id, @RequestBody TaskRequestDTO dto) {
        return taskService.updateTask(id, dto);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("@projectSecurity.isTaskMember(#id)")
    public Task updateTaskStatus(@PathVariable Long id, @RequestBody TaskStatusUpdateDTO dto) {
        return taskService.updateStatus(id, dto);
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("@projectSecurity.isTaskMember(#id)")
    public TaskAssignmentResponseDTO assignTask(@PathVariable Long id, @RequestBody TaskAssignmentDTO dto) {
        return taskService.assignTask(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@projectSecurity.isTaskMember(#id)")
    public void deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
    }
}
