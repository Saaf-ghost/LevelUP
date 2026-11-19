package com.boostup.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class BacklogDecompositionCallbackDTO {

    @JsonProperty("job_id")
    private String jobId;

    @JsonProperty("project_id")
    private Long projectId;

    private String status;

    @JsonProperty("error_message")
    private String errorMessage;

    private DecompositionResultDTO result;

    @Data
    public static class DecompositionResultDTO {
        @JsonProperty("document_summary")
        private String documentSummary;

        private List<RequirementItemDTO> requirements = new ArrayList<>();
    }

    @Data
    public static class RequirementItemDTO {
        private String id;
        private String title;
        private String description;
        private String category;

        @JsonProperty("user_stories")
        private List<UserStoryItemDTO> userStories = new ArrayList<>();
    }

    @Data
    public static class UserStoryItemDTO {
        private String title;

        @JsonProperty("user_role")
        private String userRole;

        private String action;
        private String benefit;

        @JsonProperty("acceptance_criteria")
        private List<String> acceptanceCriteria = new ArrayList<>();

        private List<TaskItemDTO> tasks = new ArrayList<>();
    }

    @Data
    public static class TaskItemDTO {
        private String title;
        private String description;

        @JsonProperty("effort_points")
        private Integer effortPoints = 3;

        @JsonProperty("estimated_hours")
        private Integer estimatedHours = 4;

        private String priority = "MEDIUM";
    }
}

