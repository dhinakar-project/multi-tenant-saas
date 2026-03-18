package com.example.saas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class TicketCreateRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotBlank(message = "Priority is required")
    @Pattern(regexp = "High|Medium|Low|Urgent", message = "Priority must be High, Medium, Low, or Urgent")
    private String priority;

    // Optional — links ticket to a sub-project within the tenant
    private UUID projectId;

    // Optional — AI-suggested category passed back from the frontend after suggestion is accepted
    private String aiCategory;
}
