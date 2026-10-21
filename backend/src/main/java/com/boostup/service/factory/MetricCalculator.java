package com.boostup.service.factory;

import com.boostup.model.Sprint;
import com.boostup.model.Task;
import com.boostup.service.MetricFormulaCalculator;
import java.util.List;

public interface MetricCalculator {
    Object calculate(Sprint sprint, List<Task> tasks, MetricFormulaCalculator formulaCalculator);
}
