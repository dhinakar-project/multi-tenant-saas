package com.example.saas.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketCategorizationResult {
    private String category;
    private String suggestedPriority;
    private Double confidence;
    private String reasoning;
}
