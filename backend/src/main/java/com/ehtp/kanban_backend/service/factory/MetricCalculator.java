package com.ehtp.kanban_backend.service.factory;

import com.ehtp.kanban_backend.model.Sprint;
import com.ehtp.kanban_backend.model.Task;
import com.ehtp.kanban_backend.service.MetricFormulaCalculator;
import java.util.List;

public interface MetricCalculator {
    Object calculate(Sprint sprint, List<Task> tasks, MetricFormulaCalculator formulaCalculator);
}
