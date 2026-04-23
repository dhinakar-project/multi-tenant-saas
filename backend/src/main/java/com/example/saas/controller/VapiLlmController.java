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
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> handleLlmRequest(
            @RequestBody Map<String, Object> body) {

        try {
            // ── 1. Parse messages — whitelist valid OpenAI roles only ───────
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> rawMessages =
                    (List<Map<String, Object>>) body.getOrDefault("messages", List.of());

            // Only valid OpenAI roles are forwarded.
            // Vapi sometimes injects messages with role=TENANT_ADMIN (Spring Security
            // principal metadata leaked into Vapi call metadata). Filtering here
            // prevents those from corrupting the conversation and causing ejection.
            Set<String> VALID_ROLES = Set.of("system", "user", "assistant", "tool", "function");

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

            log.info("Vapi LLM request: userMessage='{}', totalMessages={}", userMessage, messages.size());

            // ── 3. Process and return ──────────────────────────────────────
            String assistantReply = vapiConversationService.processMessage(userMessage, messages);
            return buildJsonResponse(assistantReply);

        } catch (Exception e) {
            log.error("VapiLlmController: unhandled error", e);
            return buildJsonResponse("I'm having trouble right now. Please try again in a moment.");
        }
    }

    /**
     * Returns a standard OpenAI chat.completion (non-streaming) JSON response.
     *
     * WHY non-streaming instead of SSE:
     * Spring Boot's ResponseEntity<String> buffers the entire response body before
     * sending it, even when Content-Type is text/event-stream. Vapi's SSE parser
     * then receives the full blob as a single chunk instead of incremental events,
     * causing parse failures. The corrupted parse state manifests as Vapi injecting
     * a message with "role: TENANT_ADMIN" into its internal conversation history,
     * which Daily.co WebRTC then rejects, triggering "Meeting has ended due to ejection".
     *
     * A plain JSON chat.completion response avoids all of this — it is simpler,
     * always parseable, and is what Vapi expects when stream=false.
     */
    private ResponseEntity<String> buildJsonResponse(String reply) {
        String safeContent = reply
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "")
                .replace("\t", "\\t");

        String completionId = "chatcmpl-" + UUID.randomUUID().toString().replace("-", "");
        long createdAt = System.currentTimeMillis() / 1000L;

        String json = "{"
            + "\"id\":\"" + completionId + "\","
            + "\"object\":\"chat.completion\","
            + "\"created\":" + createdAt + ","
            + "\"model\":\"gpt-4o-mini\","
            + "\"choices\":[{"
            +   "\"index\":0,"
            +   "\"message\":{"
            +     "\"role\":\"assistant\","
            +     "\"content\":\"" + safeContent + "\""
            +   "},"
            +   "\"finish_reason\":\"stop\""
            + "}],"
            + "\"usage\":{"
            +   "\"prompt_tokens\":0,"
            +   "\"completion_tokens\":0,"
            +   "\"total_tokens\":0"
            + "}"
            + "}";

        return ResponseEntity.ok()
                .header("Content-Type", "application/json;charset=UTF-8")
                .header("Cache-Control", "no-cache, no-store")
                .body(json);
    }
}
