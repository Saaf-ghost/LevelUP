package com.boostup.controller;

import com.boostup.dto.AIJobStatusDTO;
import com.boostup.dto.BacklogDecompositionCallbackDTO;
import com.boostup.service.AIJobService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/v1")
public class AIJobController {

    private static final Logger logger = LoggerFactory.getLogger(AIJobController.class);
    private static final String CALLBACK_TOKEN_HEADER = "X-AI-Callback-Token";

    private final AIJobService aiJobService;
    private final String callbackToken;

    public AIJobController(
            AIJobService aiJobService,
            @Value("${app.ai.callback-token:}") String callbackToken
    ) {
        this.aiJobService = aiJobService;
        this.callbackToken = callbackToken == null ? "" : callbackToken.trim();
    }

    @PostMapping("/projects/{projectId}/ai/upload")
    @PreAuthorize("@projectSecurity.isMember(#projectId)")
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
            @RequestHeader(value = CALLBACK_TOKEN_HEADER, required = false) String token,
            @RequestBody BacklogDecompositionCallbackDTO payload
    ) {
        verifyCallbackToken(token);
        aiJobService.handleWorkerCallback(jobId, payload);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/jobs/{jobId}/progress")
    public SseEmitter streamJobProgress(@PathVariable String jobId) {
        // Validates project membership before streaming anything.
        aiJobService.getJobStatus(jobId);

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

    private void verifyCallbackToken(String providedToken) {
        if (callbackToken.isBlank()) {
            logger.error("Rejecting AI worker callback: app.ai.callback-token is not configured");
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI callback is not configured");
        }
        if (providedToken == null
                || !MessageDigest.isEqual(
                        callbackToken.getBytes(StandardCharsets.UTF_8),
                        providedToken.getBytes(StandardCharsets.UTF_8))) {
            logger.warn("Rejecting AI worker callback with an invalid token");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid callback token");
        }
    }
}
