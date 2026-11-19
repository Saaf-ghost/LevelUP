package com.boostup.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIJobMessageDTO implements Serializable {
    @JsonProperty("job_id")
    private String jobId;

    @JsonProperty("project_id")
    private Long projectId;

    @JsonProperty("file_path")
    private String filePath;
}

