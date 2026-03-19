package com.example.saas.service;

import com.example.saas.dto.AiSuggestResponse;
import com.example.saas.dto.TicketCategorizationResult;
import com.example.saas.model.Ticket;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String GEMINI_BASE_URL =
        "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    // ─────────────────────────────────────────────────────────
    // FEATURE 1: Suggest category + priority from title/desc
    // ─────────────────────────────────────────────────────────
    public AiSuggestResponse suggestCategoryAndPriority(String title, String description) {
        String prompt = """
            You are a support ticket classifier for an enterprise SaaS product.
            Analyze the following ticket and return a JSON object with exactly these two fields:
            - "priority": one of "High", "Medium", "Low"
            - "category": one of "Bug", "Feature Request", "Performance", "Security", "UI/UX", "Documentation", "Other"

            Rules:
            - High: system outages, security vulnerabilities, data loss, blocking production issues
            - Medium: significant feature broken but workaround exists, performance degradation
            - Low: minor UI glitches, feature requests, non-urgent improvements

            Ticket Title: %s
            Ticket Description: %s

            Respond ONLY with a raw JSON object. No markdown, no explanation, no code blocks.
            Example: {"priority":"High","category":"Bug"}
            """.formatted(title, description != null ? description : "(no description)");

        String rawResponse = callGemini(prompt);

        try {
            String clean = rawResponse.trim()
                .replaceAll("(?s)```json", "").replaceAll("```", "").trim();
            JsonNode json = objectMapper.readTree(clean);

            String priority = json.path("priority").asText("Medium");
            String category = json.path("category").asText("Other");

            // Guard: enforce allowed values
            if (!List.of("High", "Medium", "Low").contains(priority)) priority = "Medium";

            return new AiSuggestResponse(priority, category, null, null);
        } catch (Exception e) {
            log.error("Failed to parse Gemini suggest response: {}", rawResponse, e);
            // Graceful degradation — never crash the ticket create flow
            return new AiSuggestResponse("Medium", "Other", null, null);
        }
    }

    // ─────────────────────────────────────────────────────────
    // FEATURE 2: Generate a draft reply for an existing ticket
    // ─────────────────────────────────────────────────────────
    public AiSuggestResponse generateDraftReply(Ticket ticket) {
        String prompt = """
            You are a professional support agent for an enterprise SaaS company.
            Write a helpful, empathetic, and concise draft reply to the following support ticket.

            The reply must:
            - Acknowledge the issue with empathy
            - Clearly state next steps (e.g. "We are investigating and will update you within 2 hours")
            - Be 3-5 sentences max
            - NOT use generic placeholders like [Your Name] or [Team]
            - Sound like it was written by a real, senior support agent
            %s

            Ticket Title: %s
            Ticket Description: %s
            Priority: %s
            Current Status: %s

            Write only the reply text, nothing else:
            """.formatted(
                ticket.getPriority().equals("High") ? "- High priority: be especially urgent and reassuring" : "",
                ticket.getTitle(),
                ticket.getDescription() != null ? ticket.getDescription() : "No description provided",
                ticket.getPriority(),
                ticket.getStatus()
            );

        String draftReply = callGemini(prompt);
        return new AiSuggestResponse(null, null, draftReply.trim(), null);
    }

    // ─────────────────────────────────────────────────────────
    // FEATURE 3: Detect duplicate tickets semantically
    // ─────────────────────────────────────────────────────────
    public AiSuggestResponse detectDuplicates(String newTitle, String newDescription,
                                               List<Ticket> existingOpenTickets) {
        if (existingOpenTickets.isEmpty()) {
            return new AiSuggestResponse(null, null, null, new ArrayList<>());
        }

        StringBuilder existingList = new StringBuilder();
        for (int i = 0; i < existingOpenTickets.size(); i++) {
            Ticket t = existingOpenTickets.get(i);
            existingList.append((i + 1)).append(". ID=").append(t.getId())
                .append(" | Title=").append(t.getTitle()).append("\n");
        }

        String prompt = """
            You are a duplicate ticket detector for a SaaS support system.
            A new ticket is being submitted. Compare it semantically against existing open tickets.

            NEW TICKET:
            Title: %s
            Description: %s

            EXISTING OPEN TICKETS:
            %s

            Return a JSON array of tickets with similarity > 0.6.
            Each object must have exactly: "id" (string), "title" (string), "similarityScore" (float 0-1).
            Return an empty array [] if no duplicates found.
            Respond ONLY with a raw JSON array. No markdown. No explanation.
            Example: [{"id":"abc-123","title":"Login page broken","similarityScore":0.85}]
            """.formatted(
                newTitle,
                newDescription != null ? newDescription : "(no description)",
                existingList
            );

        String rawResponse = callGemini(prompt);

        try {
            String clean = rawResponse.trim()
                .replaceAll("(?s)```json", "").replaceAll("```", "").trim();
            JsonNode arr = objectMapper.readTree(clean);

            List<AiSuggestResponse.DuplicateTicket> duplicates = new ArrayList<>();
            if (arr.isArray()) {
                for (JsonNode node : arr) {
                    String status = existingOpenTickets.stream()
                        .filter(t -> t.getId().toString().equals(node.path("id").asText()))
                        .map(Ticket::getStatus)
                        .findFirst().orElse("Open");

                    duplicates.add(new AiSuggestResponse.DuplicateTicket(
                        node.path("id").asText(),
                        node.path("title").asText(),
                        status,
                        node.path("similarityScore").asDouble(0.7)
                    ));
                }
            }
            return new AiSuggestResponse(null, null, null, duplicates);
        } catch (Exception e) {
            log.error("Failed to parse Gemini duplicate response: {}", rawResponse, e);
            return new AiSuggestResponse(null, null, null, new ArrayList<>());
        }
    }

    // ─────────────────────────────────────────────────────────
    // FEATURE 4: Full categorization for async post-create flow
    // ─────────────────────────────────────────────────────────
    public TicketCategorizationResult classify(String title, String description) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("GeminiService.classify: GEMINI_API_KEY not set — skipping");
            return null;
        }

        String prompt = """
                You are a support ticket classifier. Analyze the following support ticket and respond with ONLY a JSON object, no explanation, no markdown, no code blocks.

                Title: %s
                Description: %s

                Respond with exactly this JSON format:
                {
                  "category": "<one of: Bug, Feature Request, Support, Billing, Performance, Security, Documentation, Other>",
                  "suggestedPriority": "<one of: Low, Medium, High, Critical>",
                  "confidence": <float between 0.0 and 1.0>,
                  "reasoning": "<one sentence max explaining your classification>"
                }
                """.formatted(title, description == null ? "" : description);

        try {
            String rawResponse = callGemini(prompt);
            String clean = rawResponse.trim()
                .replaceAll("(?s)```json", "").replaceAll("```", "").trim();
            return objectMapper.readValue(clean, com.example.saas.dto.TicketCategorizationResult.class);
        } catch (Exception e) {
            log.error("GeminiService.classify failed: {}", e.getMessage());
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────
    // FEATURE 5: Voice assistant response (used by VapiConversationService)
    // ─────────────────────────────────────────────────────────
    public String generateVoiceResponse(String prompt) {
        try {
            return callGemini(prompt);
        } catch (Exception e) {
            log.error("Voice response generation failed: {}", e.getMessage());
            return "I'm having trouble connecting right now. Please try again in a moment.";
        }
    }

    // ─────────────────────────────────────────────────────────
    // PRIVATE HELPER — Single entry point for all Gemini calls
    // ─────────────────────────────────────────────────────────

    private String callGemini(String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new RuntimeException("Gemini API key is not configured. Set GEMINI_API_KEY env var.");
        }

        List<String> modelsToTry = List.of(
            "gemini-2.0-flash-lite",
            "gemini-2.0-flash",
            "gemini-2.5-flash"
        );
        Exception lastException = null;

        for (String targetModel : modelsToTry) {
            String url = String.format(GEMINI_BASE_URL, targetModel, apiKey);

            Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                    Map.of("parts", List.of(
                        Map.of("text", prompt)
                    ))
                ),
                "generationConfig", Map.of(
                    "temperature", 0.2,       // Low = more deterministic, consistent output
                    "maxOutputTokens", 512
                )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            try {
                ResponseEntity<JsonNode> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, JsonNode.class
                );

                JsonNode body = response.getBody();
                if (body == null || !body.has("candidates")) {
                    throw new RuntimeException("Empty or invalid Gemini response");
                }

                return body.path("candidates").get(0)
                    .path("content")
                    .path("parts").get(0)
                    .path("text").asText();

            } catch (Exception e) {
                log.warn("Gemini API call failed for model {}: {}", targetModel, e.getMessage());
                lastException = e;
            }
        }
        log.error("All Gemini model fallbacks failed.");
        throw new RuntimeException("AI service temporarily unavailable. Please try again.", lastException);
    }
}
