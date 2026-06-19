package com.ehtp.kanban_backend.service.factory;

public class MetricCalculatorFactory {
    public static MetricCalculator getCalculator(String type) {
        if (type == null) {
            throw new IllegalArgumentException("Calculator type cannot be null");
        }
        switch (type.toLowerCase()) {
            case "velocity":
                return new VelocityCalculator();
            case "health":
                return new HealthCalculator();
            case "workload":
                return new WorkloadCalculator();
            default:
                throw new IllegalArgumentException("Unknown calculator type: " + type);
        }
    }
}
