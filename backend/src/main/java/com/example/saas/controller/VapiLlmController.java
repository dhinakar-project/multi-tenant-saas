package com.example.saas.controller;

import com.example.saas.service.VapiConversationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import com.example.saas.model.User;
import com.example.saas.model.Tenant;
import com.example.saas.repository.TenantRepository;

import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Custom LLM endpoint for Vapi (provider: "custom-llm").
 *
 * Vapi's server ALWAYS sends stream:true, so we must return proper SSE.
 * We use StreamingResponseBody so Spring writes directly to the socket
 * without buffering the entire body first (which broke our previous impl).
 */
@Slf4j
@RestController
@RequestMapping("/api/vapi")
@RequiredArgsConstructor
public class VapiLlmController {

    private final VapiConversationService vapiConversationService;
    private final ObjectMapper objectMapper;
    private final TenantRepository tenantRepository;

    @GetMapping("/config")
    public ResponseEntity<Map<String, String>> getVapiConfig(
            @AuthenticationPrincipal User user) {
        String slug = "";
        if (user != null && user.getTenantId() != null) {
            Tenant tenant = tenantRepository.findById(user.getTenantId()).orElse(null);
            if (tenant != null) {
                slug = tenant.getSlug();
            }
        }
        return ResponseEntity.ok(Map.of("tenantSlug", slug));
    }

    @PostMapping(value = "/llm", consumes = "application/json")
    public ResponseEntity<StreamingResponseBody> handleLlmRequest(
            @RequestBody Map<String, Object> body) {

        // ── 1. Whitelist-filter messages ──────────────────────────────────
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rawMessages =
                (List<Map<String, Object>>) body.getOrDefault("messages", List.of());

        Set<String> VALID_ROLES = Set.of("system", "user", "assistant", "tool", "function");
        List<Map<String, String>> messages = new ArrayList<>();
        for (Map<String, Object> m : rawMessages) {
            String role    = String.valueOf(m.getOrDefault("role", ""));
            String content = String.valueOf(m.getOrDefault("content", ""));
            
            if (!VALID_ROLES.contains(role)) {
                log.warn("VapiLlmController: skipping invalid role '{}' (content preview: {})", 
                         role, content.length() > 50 ? content.substring(0, 50) : content);
                continue;
            }
            // Normalize empty content to prevent LLM errors
            if (content.isBlank()) content = "(empty)";
            messages.add(Map.of("role", role, "content", content));
        }

        // ── 2. Last user message ──────────────────────────────────────────
        String userMessage = "Hello";
        for (int i = messages.size() - 1; i >= 0; i--) {
            if ("user".equals(messages.get(i).get("role"))) {
                String c = messages.get(i).get("content");
                if (c != null && !c.isBlank()) { userMessage = c; }
                break;
            }
        }
        log.info("Vapi LLM: userMessage='{}' messages={}", userMessage, messages.size());

        // ── 3. Build reply before streaming (keeps SSE fast) ─────────────
        String assistantReply;
        try {
            assistantReply = vapiConversationService.processMessage(userMessage, messages);
        } catch (Exception e) {
            log.error("VapiLlmController: processMessage failed", e);
            assistantReply = "I'm having trouble right now. Please try again.";
        }
        final String reply = assistantReply;

        // ── 4. Stream SSE directly to socket via StreamingResponseBody ────
        // StreamingResponseBody writes to the raw OutputStream without Spring
        // collecting the entire body first — this is critical for SSE to work.
        StreamingResponseBody stream = outputStream -> {
            try (PrintWriter writer = new PrintWriter(outputStream, true, StandardCharsets.UTF_8)) {
                String safe = reply
                        .replace("\\", "\\\\")
                        .replace("\"", "\\\"")
                        .replace("\n", "\\n")
                        .replace("\r", "")
                        .replace("\t", "\\t");

                String id = "chatcmpl-" + UUID.randomUUID().toString().replace("-", "");
                long ts = System.currentTimeMillis() / 1000L;

                // Chunk 1 — content
                writer.print("data: {\"id\":\"" + id + "\",\"object\":\"chat.completion.chunk\","
                        + "\"created\":" + ts + ",\"model\":\"gpt-4o-mini\","
                        + "\"choices\":[{\"index\":0,\"delta\":{\"role\":\"assistant\","
                        + "\"content\":\"" + safe + "\"},\"finish_reason\":null}]}\n\n");
                writer.flush();

                // Chunk 2 — stop
                writer.print("data: {\"id\":\"" + id + "\",\"object\":\"chat.completion.chunk\","
                        + "\"created\":" + ts + ",\"model\":\"gpt-4o-mini\","
                        + "\"choices\":[{\"index\":0,\"delta\":{},\"finish_reason\":\"stop\"}]}\n\n");
                writer.flush();

                // Chunk 3 — done
                writer.print("data: [DONE]\n\n");
                writer.flush();
            } catch (Exception e) {
                log.error("VapiLlmController: SSE write error", e);
            }
        };

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_EVENT_STREAM)
                .header("Cache-Control", "no-cache, no-transform")
                .header("X-Accel-Buffering", "no")
                .header("Connection", "keep-alive")
                .body(stream);
    }
}
