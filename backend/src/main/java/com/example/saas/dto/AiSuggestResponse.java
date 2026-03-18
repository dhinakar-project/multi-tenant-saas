package com.example.saas.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AiSuggestResponse {

    // Feature 1: category + priority suggestions (null for other features)
    private String suggestedPriority;
    private String suggestedCategory;

    // Feature 2: draft reply text (null for other features)
    private String draftReply;

    // Feature 3: duplicate ticket list (null for other features)
    private List<DuplicateTicket> duplicates;

    // ── Nested DTO for duplicate detection results ──
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DuplicateTicket {
        private String id;
        private String title;
        private String status;
        private double similarityScore; // 0.0 to 1.0
    }
}
