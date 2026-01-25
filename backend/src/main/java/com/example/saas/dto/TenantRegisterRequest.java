package com.example.saas.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TenantRegisterRequest {
    private String tenantName;
    private String tenantSlug;
    private String adminName;
    private String adminEmail;
    private String adminPassword;
}
