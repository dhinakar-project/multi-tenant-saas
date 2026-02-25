package com.example.saas.controller;

import com.example.saas.model.TenantInvite;
import com.example.saas.model.User;
import com.example.saas.service.InviteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/invites")
@RequiredArgsConstructor
public class InviteController {

    private final InviteService inviteService;

    @PostMapping
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ResponseEntity<TenantInvite> createInvite(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String role = request.getOrDefault("role", "MEMBER");

        log.info("Creating invite for email: {} with role: {}", email, role);
        TenantInvite invite = inviteService.createInvite(email, role);

        return ResponseEntity.ok(invite);
    }

    @PostMapping("/accept")
    public ResponseEntity<Map<String, String>> acceptInvite(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal User user) {

        String token = request.get("token");
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Token is required"));
        }

        log.info("User {} accepting invite token: {}", user.getEmail(), token);
        inviteService.acceptInvite(token, user);

        return ResponseEntity.ok(Map.of("message", "Invite accepted successfully"));
    }
}
