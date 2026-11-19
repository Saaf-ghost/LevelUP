package com.boostup.dto;

import com.boostup.model.AIJobStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIJobStatusDTO {
    private String jobId;
    private Long projectId;
    private AIJobStatus status;
    private String message;
}

