package com.example.saas.controller;

import com.example.saas.config.RateLimitConfig;
import com.example.saas.dto.AiSuggestRequest;
import com.example.saas.dto.AiSuggestResponse;
import com.example.saas.exception.ResourceNotFoundException;
import com.example.saas.model.Ticket;
import com.example.saas.model.User;
import com.example.saas.repository.TicketRepository;
import com.example.saas.service.GeminiService;
import io.github.bucket4j.Bucket;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final GeminiService geminiService;
    private final TicketRepository ticketRepository;
    private final RateLimitConfig rateLimitConfig;

    /** Extracts the authenticated user ID for per-user rate limit keying. */
    private String getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User u) return u.getId().toString();
        return principal.toString();
    }

    private void checkRateLimit(String suffix) {
        Bucket bucket = rateLimitConfig.resolveBucket("ai:" + suffix + ":" + getCurrentUserId());
        if (!bucket.tryConsume(1)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                "AI rate limit exceeded. Max 20 requests/minute.");
        }
    }

    /**
     * Feature 1: Suggest category + priority while the user types.
     * Called from the frontend with 800ms debounce on title/description fields.
     */
    @PostMapping("/suggest")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'MEMBER')")
    public AiSuggestResponse suggest(@Valid @RequestBody AiSuggestRequest request) {
        checkRateLimit("suggest");
        log.info("AI suggest requested | title: '{}'", request.getTitle());
        return geminiService.suggestCategoryAndPriority(request.getTitle(), request.getDescription());
    }

    /**
     * Feature 2: Generate a draft reply for an existing ticket.
     * Only admins/agents can use this from the TicketDetail view.
     */
    @PostMapping("/draft-reply/{ticketId}")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public AiSuggestResponse draftReply(@PathVariable UUID ticketId) {
        checkRateLimit("draft-reply");
        log.info("AI draft reply requested | ticketId: {}", ticketId);
        Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new ResourceNotFoundException("Ticket", ticketId));
        return geminiService.generateDraftReply(ticket);
    }

    /**
     * Feature 3: Detect duplicate tickets before the user submits.
     * Fetches the last 50 open tickets in this tenant (TenantFilter enforces isolation)
     * and sends them to Gemini for semantic comparison.
     */
    @PostMapping("/check-duplicate")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'MEMBER')")
    public AiSuggestResponse checkDuplicate(@Valid @RequestBody AiSuggestRequest request) {
        checkRateLimit("check-duplicate");
        log.info("Duplicate check requested | title: '{}'", request.getTitle());
        List<Ticket> openTickets = ticketRepository
            .findAllByStatus("Open", PageRequest.of(0, 50))
            .getContent();
        return geminiService.detectDuplicates(request.getTitle(), request.getDescription(), openTickets);
    }
}
