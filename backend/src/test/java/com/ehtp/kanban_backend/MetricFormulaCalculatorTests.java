package com.ehtp.kanban_backend;

import com.ehtp.kanban_backend.service.MetricFormulaCalculator;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class MetricFormulaCalculatorTests {
    private final MetricFormulaCalculator calculator = new MetricFormulaCalculator();

    @Test
    void velocityRatioAvoidsDivisionByZero() {
        assertThat(calculator.velocityRatio(10, 0)).isZero();
    }

    @Test
    void workloadBalancePenalizesOver120PercentLoad() {
        assertThat(calculator.workloadBalanceScore(List.of(1.3))).isLessThan(80.0);
    }

    @Test
    void healthScoreUsesWeightedComponents() {
        int score = calculator.healthScore(100.0, 80.0, 50.0);
        assertThat(score).isEqualTo(79);
    }
}
