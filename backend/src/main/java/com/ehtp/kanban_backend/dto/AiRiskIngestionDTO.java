package com.ehtp.kanban_backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class AiRiskIngestionDTO {
    private Integer sprintHealthScore;
    private String riskLevel;
    private List<BottleneckAlert> bottleneckAlerts;
    private String automatedStandupSummary;

    @Data
    public static class BottleneckAlert {
        private String issueId;
        private String warningMessage;
    }
}
