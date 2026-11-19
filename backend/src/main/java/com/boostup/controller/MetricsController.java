package com.boostup.controller;

import com.boostup.dto.BottleneckDTO;
import com.boostup.dto.CapacityDTO;
import com.boostup.dto.HealthDTO;
import com.boostup.dto.VelocityDTO;
import com.boostup.dto.VelocityTrendDTO;
import com.boostup.dto.WorkloadDTO;
import com.boostup.service.MetricsService;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("@projectSecurity.isSprintMember(#id)")
    public CapacityDTO getCapacity(@PathVariable Long id) {
        return metricsService.getCapacity(id);
    }

    @GetMapping("/sprints/{id}/velocity")
    @PreAuthorize("@projectSecurity.isSprintMember(#id)")
    public VelocityDTO getVelocity(@PathVariable Long id) {
        return metricsService.getVelocity(id);
    }

    @GetMapping("/sprints/{id}/workload")
    @PreAuthorize("@projectSecurity.isSprintMember(#id)")
    public List<WorkloadDTO> getWorkload(@PathVariable Long id) {
        return metricsService.getWorkload(id);
    }

    @GetMapping("/sprints/{id}/bottlenecks")
    @PreAuthorize("@projectSecurity.isSprintMember(#id)")
    public List<BottleneckDTO> getBottlenecks(@PathVariable Long id) {
        return metricsService.getBottlenecks(id);
    }

    @GetMapping("/sprints/{id}/health")
    @PreAuthorize("@projectSecurity.isSprintMember(#id)")
    public HealthDTO getHealth(@PathVariable Long id) {
        return metricsService.getHealth(id);
    }

    @GetMapping("/projects/{projectId}/velocity-trend")
    @PreAuthorize("@projectSecurity.isMember(#projectId)")
    public List<VelocityTrendDTO> getVelocityTrend(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "5") int limit
    ) {
        return metricsService.getVelocityTrend(projectId, limit);
    }
}
