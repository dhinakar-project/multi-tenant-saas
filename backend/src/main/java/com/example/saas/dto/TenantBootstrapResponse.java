package com.example.saas.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response for tenant bootstrap endpoint.
 * Returns the tenant slug to be used by frontend.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TenantBootstrapResponse {
    private String tenantSlug;
    private String tenantName;
    private String role;
    private boolean isNewTenant;
}
