package com.example.saas.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class UserDTO {
    private UUID id;
    private String email;
    private String fullName;
    private boolean active;
    private String role;
}
