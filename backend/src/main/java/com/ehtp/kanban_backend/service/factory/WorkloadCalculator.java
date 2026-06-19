package com.ehtp.kanban_backend.service.factory;

import com.ehtp.kanban_backend.dto.WorkloadDTO;
import com.ehtp.kanban_backend.model.Sprint;
import com.ehtp.kanban_backend.model.Task;
import com.ehtp.kanban_backend.model.User;
import com.ehtp.kanban_backend.service.MetricFormulaCalculator;
import java.util.*;

public class WorkloadCalculator implements MetricCalculator {
    @Override
    public List<WorkloadDTO> calculate(Sprint sprint, List<Task> tasks, MetricFormulaCalculator formulaCalculator) {
        Map<Long, User> users = new LinkedHashMap<>();
        if (sprint.getProject() != null && sprint.getProject().getMembers() != null) {
            for (User member : sprint.getProject().getMembers()) {
                users.put(member.getId(), member);
            }
        }
        for (Task task : tasks) {
            if (task.getAssignee() != null) {
                users.put(task.getAssignee().getId(), task.getAssignee());
            }
        }

        List<WorkloadDTO> workloads = new ArrayList<>();
        for (User user : users.values()) {
            List<Task> assignedTasks = tasks.stream()
                    .filter(task -> task.getAssignee() != null && task.getAssignee().getId() == user.getId())
                    .toList();
            int assigned = assignedTasks.stream().map(Task::getEffortPoints).mapToInt(p -> p == null ? 0 : p).sum();
            int completed = assignedTasks.stream()
                    .filter(task -> task.getStatus() == Task.TaskStatus.DONE)
                    .map(Task::getEffortPoints)
                    .mapToInt(p -> p == null ? 0 : p)
                    .sum();
            int remaining = assigned - completed;
            int capacity = user.getCapacityPoints() == null ? 0 : user.getCapacityPoints();
            double loadRatio = capacity <= 0 ? (assigned > 0 ? 999.0 : 0.0) : (double) assigned / capacity;
            
            double roundedLoadRatio = Math.round(loadRatio * 100.0) / 100.0;
            
            workloads.add(new WorkloadDTO(
                    user.getId(),
                    user.getFullName(),
                    assigned,
                    completed,
                    remaining,
                    capacity,
                    roundedLoadRatio,
                    capacity >= 0 && assigned > capacity,
                    loadRatio > 1.2
            ));
        }
        workloads.sort(Comparator.comparing(WorkloadDTO::fullName));
        return workloads;
    }
}
