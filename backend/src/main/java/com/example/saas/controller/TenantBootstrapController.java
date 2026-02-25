package com.example.saas.controller;

import com.example.saas.dto.TenantBootstrapResponse;
import com.example.saas.model.User;
import com.example.saas.service.InviteService;
import com.example.saas.service.TenantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Tenant bootstrap endpoint for automatic tenant onboarding.
 * Called by frontend after Clerk authentication to ensure user has a tenant.
 */
@Slf4j
@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
public class TenantBootstrapController {

    private final TenantService tenantService;
    private final InviteService inviteService;

    /**
     * Bootstrap tenant for authenticated user.
     * Creates tenant if user has none, or returns existing tenant.
     * Idempotent - safe to call multiple times.
     */
    @PostMapping("/bootstrap")
    public ResponseEntity<TenantBootstrapResponse> bootstrapTenant(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String token) {

        log.info("Bootstrapping tenant for user: {} (Clerk ID: {})", user.getEmail(), user.getClerkUserId());

        // Phase 2C: Process invite prior to bootstrapping
        if (token != null && !token.isBlank()) {
            try {
                log.info("Processing invite token {} during bootstrap for user {}", token, user.getEmail());
                inviteService.acceptInvite(token, user);
            } catch (Exception e) {
                log.warn("Failed to accept invite during bootstrap: {}", e.getMessage());
            }
        }

        TenantBootstrapResponse response = tenantService.bootstrapTenant(user);

        log.info("Tenant bootstrap complete: slug={}, isNew={}", response.getTenantSlug(), response.isNewTenant());

        return ResponseEntity.ok(response);
    }
}
