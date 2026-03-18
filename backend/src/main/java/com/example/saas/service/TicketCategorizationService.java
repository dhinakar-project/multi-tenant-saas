package com.example.saas.service;

import com.example.saas.dto.TicketCategorizationResult;
import com.example.saas.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketCategorizationService {

    private final GeminiService geminiService;
    private final TicketRepository ticketRepository;

    @Async("categorizationExecutor")
    public void categorizeAsync(UUID ticketId, String title, String description) {
        try {
            log.info("TicketCategorizationService: starting async classification for ticket {}", ticketId);

            TicketCategorizationResult result = geminiService.classify(title, description);

            if (result == null) {
                log.warn("TicketCategorizationService: classify returned null for ticket {}", ticketId);
                ticketRepository.updateAiStatus(ticketId, "FAILED");
                return;
            }

            ticketRepository.updateAiFields(
                ticketId,
                result.getCategory(),
                result.getSuggestedPriority(),
                result.getConfidence() != null ? java.math.BigDecimal.valueOf(result.getConfidence()) : null,
                result.getReasoning(),
                "DONE"
            );

            log.info("TicketCategorizationService: ticket {} categorized as '{}' with confidence {}",
                ticketId, result.getCategory(), result.getConfidence());

        } catch (Exception e) {
            log.error("TicketCategorizationService: async categorization failed for ticket {}: {}", ticketId, e.getMessage());
            try {
                ticketRepository.updateAiStatus(ticketId, "FAILED");
            } catch (Exception ex) {
                log.error("TicketCategorizationService: failed to mark ticket {} as FAILED: {}", ticketId, ex.getMessage());
            }
        }
    }
}
