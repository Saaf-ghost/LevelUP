package com.ehtp.kanban_backend.controller;

import com.ehtp.kanban_backend.dto.BottleneckDTO;
import com.ehtp.kanban_backend.dto.CapacityDTO;
import com.ehtp.kanban_backend.dto.HealthDTO;
import com.ehtp.kanban_backend.dto.VelocityDTO;
import com.ehtp.kanban_backend.dto.VelocityTrendDTO;
import com.ehtp.kanban_backend.dto.WorkloadDTO;
import com.ehtp.kanban_backend.service.MetricsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class MetricsController {
    private final MetricsService metricsService;

    public MetricsController(MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @GetMapping("/sprints/{id}/capacity")
    public CapacityDTO getCapacity(@PathVariable Long id) {
        return metricsService.getCapacity(id);
    }

    @GetMapping("/sprints/{id}/velocity")
    public VelocityDTO getVelocity(@PathVariable Long id) {
        return metricsService.getVelocity(id);
    }

    @GetMapping("/sprints/{id}/workload")
    public List<WorkloadDTO> getWorkload(@PathVariable Long id) {
        return metricsService.getWorkload(id);
    }

    @GetMapping("/sprints/{id}/bottlenecks")
    public List<BottleneckDTO> getBottlenecks(@PathVariable Long id) {
        return metricsService.getBottlenecks(id);
    }

    @GetMapping("/sprints/{id}/health")
    public HealthDTO getHealth(@PathVariable Long id) {
        return metricsService.getHealth(id);
    }

    @GetMapping("/projects/{projectId}/velocity-trend")
    public List<VelocityTrendDTO> getVelocityTrend(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "5") int limit
    ) {
        return metricsService.getVelocityTrend(projectId, limit);
    }
}
