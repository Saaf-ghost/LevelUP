package com.ehtp.kanban_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
public class DigestResponseDTO {
    private Long projectId;
    private LocalDateTime since;
    private int changesCount;
    private String summary;
    private List<String> highlights;
}
