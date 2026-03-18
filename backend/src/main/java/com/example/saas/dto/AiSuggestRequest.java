package com.example.saas.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiSuggestRequest {

    @NotBlank(message = "Title is required for AI analysis")
    private String title;

    // Optional but significantly improves AI suggestion quality
    private String description;
}
