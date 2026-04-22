package com.example.saas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiSuggestRequest {

    @NotBlank(message = "Title is required for AI analysis")
    @Size(max = 500, message = "Title must not exceed 500 characters")
    private String title;

    // Optional but significantly improves AI suggestion quality
    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;
}
