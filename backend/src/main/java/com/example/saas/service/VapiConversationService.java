package com.example.saas.service;

import com.example.saas.core.TenantContext;
import com.example.saas.model.Tenant;
import com.example.saas.model.Ticket;
import com.example.saas.repository.TenantRepository;
import com.example.saas.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VapiConversationService {

    private final GeminiService geminiService;
    private final TicketRepository ticketRepository;
    private final TenantRepository tenantRepository;

    /**
     * Main entry point called by VapiLlmController.
     * Resolves tenant from system message, gathers ticket context,
     * and builds a spoken response — using Gemini if available,
     * or a fast rule-based response using raw ticket data as fallback.
     */
    public String processMessage(String userMessage,
                                 List<Map<String, String>> messageHistory) {
        // Step 1 — Extract tenant slug from system message
        String tenantSlug = extractTenantSlug(messageHistory);

        if (tenantSlug == null || tenantSlug.isBlank()) {
            log.warn("VapiConversationService: no tenant slug found in message history");
            return "I couldn't identify your organization. Please make sure the assistant is configured correctly.";
        }

        // Step 2 — Resolve tenant and set TenantContext
        Optional<Tenant> tenantOpt = tenantRepository.findBySlug(tenantSlug);
        if (tenantOpt.isEmpty()) {
            log.warn("VapiConversationService: tenant not found for slug={}", tenantSlug);
            return "I couldn't find your organization. Please contact support.";
        }

        Tenant tenant = tenantOpt.get();
        TenantContext.setTenantId(tenant.getId());

        try {
            // Step 3 — Gather ticket data (always needed)
            List<Ticket> allTickets = safeGetTicketsByTenant(tenant);

            // Step 4 — Try Gemini for a rich conversational response
            try {
                String ticketContext = buildTicketContextFromList(allTickets);
                String conversationHistory = buildConversationHistory(messageHistory);

                String geminiPrompt = """
                        You are an AI voice assistant for a SaaS ticketing platform.
                        You help administrators understand their ticket queue and issues.

                        CURRENT TICKET DATA:
                        %s

                        CONVERSATION HISTORY:
                        %s

                        USER JUST SAID: "%s"

                        INSTRUCTIONS:
                        - Answer based on the ticket data provided above
                        - Be conversational and concise (2 to 3 sentences maximum)
                        - This response will be spoken aloud, avoid all markdown, bullet points, asterisks, or special characters
                        - Use natural spoken language only
                        - If asked about specific tickets, mention their titles naturally
                        - Speak numbers naturally: say "15 tickets" not just "15"
                        - Do not start your response with "Okay" or "Sure" or similar filler words

                        Respond with ONLY the spoken answer, nothing else:
                        """.formatted(ticketContext, conversationHistory, userMessage);

                String rawResponse = geminiService.generateVoiceResponse(geminiPrompt);

                // If Gemini returned its own fallback error message, skip to rule-based
                if (rawResponse != null
                        && !rawResponse.startsWith("I'm having trouble")
                        && !rawResponse.isBlank()
                        && !rawResponse.equals("{}")) {
                    return cleanResponse(rawResponse);
                }

            } catch (Exception geminiEx) {
                log.warn("VapiConversationService: Gemini unavailable ({}), using rule-based response",
                        geminiEx.getMessage());
            }

            // Step 5 — Rule-based fallback: answer directly from ticket data
            //          This is always fast (no external API) and keeps Vapi from timing out.
            return buildRuleBasedResponse(userMessage, allTickets);

        } finally {
            TenantContext.clear();
        }
    }

    // ─────────────────────────────────────────────────────────
    // RULE-BASED RESPONSE (fast, no Gemini dependency)
    // ─────────────────────────────────────────────────────────

    /**
     * Keyword-based response builder.
     * Answers common ticket questions directly from database data.
     * Returns a clean spoken sentence — no markdown.
     */
    public String buildRuleBasedResponse(String userMessage, List<Ticket> tickets) {
        String q = userMessage.toLowerCase();

        long total         = tickets.size();
        long open          = tickets.stream().filter(t -> "Open".equals(t.getStatus())).count();
        long inProgress    = tickets.stream().filter(t -> "InProgress".equals(t.getStatus())).count();
        long resolved      = tickets.stream().filter(t -> "Resolved".equals(t.getStatus()) || "Closed".equals(t.getStatus())).count();
        long urgent        = tickets.stream().filter(t -> "Urgent".equals(t.getPriority()) || "Critical".equals(t.getPriority())).count();
        long high          = tickets.stream().filter(t -> "High".equals(t.getPriority())).count();

        // — Total count questions —
        if (q.contains("total") || q.contains("how many") || q.contains("count")) {
            if (q.contains("urgent") || q.contains("critical")) {
                return String.format("You have %d urgent or critical tickets that need immediate attention.", urgent);
            }
            if (q.contains("open")) {
                return String.format("There are %d open tickets right now.", open);
            }
            if (q.contains("progress") || q.contains("ongoing")) {
                return String.format("There are %d tickets currently in progress.", inProgress);
            }
            if (q.contains("resolved") || q.contains("closed") || q.contains("done")) {
                return String.format("There are %d resolved or closed tickets.", resolved);
            }
            return String.format("You have %d tickets in total. %d are open, %d are in progress, and %d are resolved.", total, open, inProgress, resolved);
        }

        // — Status breakdown —
        if (q.contains("status") || q.contains("breakdown") || q.contains("summary") || q.contains("overview")) {
            return String.format("Here's your ticket summary: %d total, %d open, %d in progress, %d resolved, and %d urgent.", total, open, inProgress, resolved, urgent);
        }

        // — Urgent / priority questions —
        if (q.contains("urgent") || q.contains("critical") || q.contains("priority") || q.contains("important")) {
            List<Ticket> urgentList = tickets.stream()
                    .filter(t -> "Urgent".equals(t.getPriority()) || "Critical".equals(t.getPriority()))
                    .limit(3)
                    .collect(Collectors.toList());
            if (urgentList.isEmpty()) {
                return "Great news, there are no urgent or critical tickets right now.";
            }
            String titles = urgentList.stream().map(Ticket::getTitle).collect(Collectors.joining(", "));
            return String.format("You have %d urgent tickets. The top ones are: %s.", urgent, titles);
        }

        // — Open tickets list —
        if (q.contains("open") || q.contains("pending")) {
            List<Ticket> openList = tickets.stream()
                    .filter(t -> "Open".equals(t.getStatus()))
                    .limit(3)
                    .collect(Collectors.toList());
            if (openList.isEmpty()) {
                return "There are no open tickets at the moment. Everything is either in progress or resolved.";
            }
            String titles = openList.stream().map(Ticket::getTitle).collect(Collectors.joining(", "));
            return String.format("There are %d open tickets. Recent ones include: %s.", open, titles);
        }

        // — Hello / greeting —
        if (q.contains("hello") || q.contains("hi") || q.contains("hey") || userMessage.trim().length() < 5) {
            return String.format("Hello! You currently have %d tickets, with %d open and %d urgent. What would you like to know?", total, open, urgent);
        }

        // — Default catch-all —
        return String.format("You have %d tickets total: %d open, %d in progress, %d resolved, and %d urgent. Ask me anything more specific!", total, open, inProgress, resolved, urgent);
    }



    // ─────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────

    /**
     * Fast fallback called by VapiLlmController when processMessage exceeds 4s.
     * Resolves tenant and tickets synchronously (DB only, no Gemini) and returns
     * a rule-based spoken response — always finishes in under 1 second.
     */
    public String buildFastFallback(String userMessage, List<Map<String, String>> messageHistory) {
        String tenantSlug = extractTenantSlug(messageHistory);
        if (tenantSlug == null || tenantSlug.isBlank()) {
            return "I couldn't identify your organization. Please reconfigure the assistant.";
        }
        Optional<Tenant> tenantOpt = tenantRepository.findBySlug(tenantSlug);
        if (tenantOpt.isEmpty()) {
            return "I couldn't find your organization. Please contact support.";
        }
        Tenant tenant = tenantOpt.get();
        TenantContext.setTenantId(tenant.getId());
        try {
            List<Ticket> tickets = safeGetTicketsByTenant(tenant);
            return buildRuleBasedResponse(userMessage, tickets);
        } finally {
            TenantContext.clear();
        }
    }

    /**
     * Scans the system message for a "tenant:" prefix and extracts the slug.
     * The frontend embeds "tenant:my-company-slug" in the system prompt.
     */
    private String extractTenantSlug(List<Map<String, String>> messageHistory) {
        if (messageHistory == null || messageHistory.isEmpty()) return null;

        for (Map<String, String> msg : messageHistory) {
            if ("system".equals(msg.get("role"))) {
                String content = msg.get("content");
                if (content != null) {
                    for (String line : content.split("\n")) {
                        line = line.trim();
                        if (line.startsWith("tenant:")) {
                            return line.substring("tenant:".length()).trim();
                        }
                    }
                }
            }
        }
        return null;
    }

    /**
     * Safely fetches all tickets for the current tenant.
     * Returns an empty list on failure rather than throwing.
     */
    private List<Ticket> safeGetTicketsByTenant(Tenant tenant) {
        try {
            return ticketRepository.findByTenantId(tenant.getId());
        } catch (Exception e) {
            log.error("VapiConversationService.safeGetTicketsByTenant failed: {}", e.getMessage());
            return java.util.Collections.emptyList();
        }
    }

    /**
     * Builds a readable summary string from an already-fetched ticket list.
     * Used to build the Gemini prompt context.
     */
    private String buildTicketContextFromList(List<Ticket> allTickets) {
        long total = allTickets.size();
        long openCount = allTickets.stream().filter(t -> "Open".equals(t.getStatus())).count();
        long inProgressCount = allTickets.stream().filter(t -> "InProgress".equals(t.getStatus())).count();
        long resolvedCount = allTickets.stream()
                .filter(t -> "Resolved".equals(t.getStatus()) || "Closed".equals(t.getStatus())).count();
        long highPriorityCount = allTickets.stream()
                .filter(t -> "Urgent".equals(t.getPriority()) || "Critical".equals(t.getPriority())
                        || "High".equals(t.getPriority())).count();

        List<Ticket> recentOpen = allTickets.stream()
                .filter(t -> "Open".equals(t.getStatus()))
                .limit(5)
                .collect(Collectors.toList());

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Total=%d, Open=%d, InProgress=%d, Resolved/Closed=%d, High Priority=%d.",
                total, openCount, inProgressCount, resolvedCount, highPriorityCount));

        if (!recentOpen.isEmpty()) {
            sb.append(" Recent open tickets: ");
            for (int i = 0; i < recentOpen.size(); i++) {
                Ticket t = recentOpen.get(i);
                sb.append(String.format("%d. '%s' (%s priority)", i + 1, t.getTitle(), t.getPriority()));
                if (i < recentOpen.size() - 1) sb.append(", ");
            }
            sb.append(".");
        }
        return sb.toString();
    }

    /**
     * Formats prior conversation messages (excluding system messages) into
     * a readable history string for the Gemini prompt.
     */
    private String buildConversationHistory(List<Map<String, String>> messageHistory) {
        if (messageHistory == null || messageHistory.isEmpty()) return "(none)";

        StringBuilder sb = new StringBuilder();
        for (Map<String, String> msg : messageHistory) {
            String role = msg.get("role");
            String content = msg.get("content");
            if ("user".equals(role) || "assistant".equals(role)) {
                sb.append(role.toUpperCase()).append(": ").append(content).append("\n");
            }
        }
        String result = sb.toString().trim();
        return result.isBlank() ? "(none)" : result;
    }

    /**
     * Removes markdown artifacts that are not suitable for spoken TTS output.
     */
    private String cleanResponse(String response) {
        if (response == null) return "I'm having trouble responding right now. Please try again.";
        return response
                .replaceAll("\\*\\*", "")        // bold
                .replaceAll("\\*", "")            // italic / bullet
                .replaceAll("#+ ", "")            // headings
                .replaceAll("- ", "")             // list dashes
                .replaceAll("\\n+", " ")          // newlines → spaces
                .replaceAll("\\s{2,}", " ")       // collapse extra spaces
                .trim();
    }
}
