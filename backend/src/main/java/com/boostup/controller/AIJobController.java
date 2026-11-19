package com.boostup.controller;

import com.boostup.dto.AIJobStatusDTO;
import com.boostup.dto.BacklogDecompositionCallbackDTO;
import com.boostup.service.AIJobService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/v1")
public class AIJobController {

    private final AIJobService aiJobService;

    public AIJobController(AIJobService aiJobService) {
        this.aiJobService = aiJobService;
    }

    @PostMapping("/projects/{projectId}/ai/upload")
    @PreAuthorize("@projectSecurity.hasRole(#projectId, 'MEMBER')")
    public ResponseEntity<AIJobStatusDTO> uploadPrd(
            @PathVariable Long projectId,
            @RequestParam("file") MultipartFile file
    ) {
        AIJobStatusDTO response = aiJobService.submitPdfForDecomposition(projectId, file);
        return ResponseEntity.accepted().body(response);
    }

    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<AIJobStatusDTO> getJobStatus(@PathVariable String jobId) {
        return ResponseEntity.ok(aiJobService.getJobStatus(jobId));
    }

    @PostMapping("/jobs/{jobId}/callback")
    public ResponseEntity<Void> receiveWorkerCallback(
            @PathVariable String jobId,
            @RequestBody BacklogDecompositionCallbackDTO payload
    ) {
        aiJobService.handleWorkerCallback(jobId, payload);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/jobs/{jobId}/progress")
    public SseEmitter streamJobProgress(@PathVariable String jobId) {
        SseEmitter emitter = new SseEmitter(180_000L); // 3 minutes timeout
        ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();

        executor.scheduleAtFixedRate(() -> {
            try {
                AIJobStatusDTO status = aiJobService.getJobStatus(jobId);
                emitter.send(SseEmitter.event().name("status").data(status));
                if (status.getStatus() != null &&
                        ("COMPLETED".equals(status.getStatus().name()) || "FAILED".equals(status.getStatus().name()))) {
                    emitter.complete();
                    executor.shutdown();
                }
            } catch (Exception ex) {
                emitter.completeWithError(ex);
                executor.shutdown();
            }
        }, 0, 2, TimeUnit.SECONDS);

        emitter.onCompletion(executor::shutdown);
        emitter.onTimeout(executor::shutdown);
        return emitter;
    }
}

