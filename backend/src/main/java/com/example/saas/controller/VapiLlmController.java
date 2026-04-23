package com.example.saas.controller;

import com.example.saas.service.VapiConversationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Custom LLM endpoint consumed by Vapi.
 *
 * Vapi is configured with provider: "custom-llm" pointing to this URL.
 * It sends a standard OpenAI-compatible chat completion request and expects
 * an OpenAI-compatible response. No Clerk JWT is sent by Vapi, so this
 * endpoint is public (see SecurityConfig).
 *
 * Vapi request body shape:
 * {
 *   "model": "gpt-4o-mini",
 *   "messages": [
 *     {"role": "system", "content": "...tenant:my-slug..."},
 *     {"role": "user",   "content": "how many urgent tickets?"}
 *   ],
 *   "stream": false
 * }
 */
@Slf4j
@RestController
@RequestMapping("/api/vapi")
@RequiredArgsConstructor
public class VapiLlmController {

    private final VapiConversationService vapiConversationService;
    private final ObjectMapper objectMapper;

    @PostMapping(value = "/llm",
            consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> handleLlmRequest(
            @RequestBody Map<String, Object> body) {

        try {
            // ── 1. Parse messages array ────────────────────────────────────
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> rawMessages =
                    (List<Map<String, Object>>) body.getOrDefault("messages", List.of());

            // Whitelist: only valid OpenAI roles are forwarded.
            // Vapi can echo back messages with role=TENANT_ADMIN (leaked from Spring Security
            // principal metadata). Passing those to Vapi in the response corrupts its message
            // list and triggers the "Meeting has ended due to ejection" error.
            java.util.Set<String> VALID_ROLES = java.util.Set.of("system", "user", "assistant", "tool", "function");

            List<Map<String, String>> messages = new ArrayList<>();
            for (Map<String, Object> rawMsg : rawMessages) {
                String role    = String.valueOf(rawMsg.getOrDefault("role", ""));
                String content = String.valueOf(rawMsg.getOrDefault("content", ""));
                if (!VALID_ROLES.contains(role)) {
                    log.warn("VapiLlmController: dropping message with invalid role '{}' — not a valid OpenAI role", role);
                    continue;
                }
                messages.add(Map.of("role", role, "content", content));
            }

            // ── 2. Extract last user message ───────────────────────────────
            String userMessage = "Hello";
            for (int i = messages.size() - 1; i >= 0; i--) {
                if ("user".equals(messages.get(i).get("role"))) {
                    userMessage = messages.get(i).get("content");
                    if (userMessage.isBlank()) userMessage = "Hello";
                    break;
                }
            }

            log.debug("Vapi LLM request payload: {}", body);
            log.debug("Vapi LLM parsed: userMessage='{}', messages={}", userMessage, messages.size());

            // ── 3. Process through conversation service ────────────────────
            String assistantReply = vapiConversationService.processMessage(userMessage, messages);
            return buildSseResponse(assistantReply);

        } catch (Exception e) {
            log.error("VapiLlmController: unhandled error", e);
            return buildSseResponse("I'm having trouble right now. Please try again in a moment.");
        }
    }

    private ResponseEntity<String> buildSseResponse(String reply) {
        String safeContent = reply
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "");

        String completionId = "chatcmpl-" + UUID.randomUUID().toString().replace("-", "");
        long createdAt = System.currentTimeMillis() / 1000L;

        StringBuilder sse = new StringBuilder();

        // Chunk 1: Send content payload
        sse.append("data: {")
           .append("\"id\":\"").append(completionId).append("\",")
           .append("\"object\":\"chat.completion.chunk\",")
           .append("\"created\":").append(createdAt).append(",")
           .append("\"model\":\"gpt-4o-mini\",")
           .append("\"choices\":[{\"index\":0,\"delta\":{\"role\":\"assistant\",\"content\":\"")
           .append(safeContent).append("\"},\"finish_reason\":null}]")
           .append("}\n\n");

        // Chunk 2: Send stop signal
        sse.append("data: {")
           .append("\"id\":\"").append(completionId).append("\",")
           .append("\"object\":\"chat.completion.chunk\",")
           .append("\"created\":").append(createdAt).append(",")
           .append("\"model\":\"gpt-4o-mini\",")
           .append("\"choices\":[{\"index\":0,\"delta\":{},\"finish_reason\":\"stop\"}]")
           .append("}\n\n");

        // Chunk 3: DONE signal
        sse.append("data: [DONE]\n\n");

        return ResponseEntity.ok()
                .header("Content-Type", "text/event-stream;charset=UTF-8")
                .header("Cache-Control", "no-cache, no-transform")
                .header("X-Accel-Buffering", "no")
                .header("Connection", "keep-alive")
                .body(sse.toString());
    }
}
