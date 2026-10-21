package com.boostup.service.factory;

import com.boostup.dto.VelocityDTO;
import com.boostup.model.Sprint;
import com.boostup.model.Task;
import com.boostup.service.MetricFormulaCalculator;
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
