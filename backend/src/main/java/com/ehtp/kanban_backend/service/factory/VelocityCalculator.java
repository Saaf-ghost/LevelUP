package com.ehtp.kanban_backend.service.factory;

import com.ehtp.kanban_backend.dto.VelocityDTO;
import com.ehtp.kanban_backend.model.Sprint;
import com.ehtp.kanban_backend.model.Task;
import com.ehtp.kanban_backend.service.MetricFormulaCalculator;
import java.util.List;

public class VelocityCalculator implements MetricCalculator {
    @Override
    public VelocityDTO calculate(Sprint sprint, List<Task> tasks, MetricFormulaCalculator formulaCalculator) {
        int planned = sprint.getPointsPlanned() == null ? 0 : sprint.getPointsPlanned();
        int completed = tasks.stream()
                .filter(task -> task.getStatus() == Task.TaskStatus.DONE)
                .map(Task::getEffortPoints)
                .mapToInt(points -> points == null ? 0 : points)
                .sum();
        double ratio = formulaCalculator.velocityRatio(completed, planned);
        return new VelocityDTO(planned, completed, ratio);
    }
}
