package com.example.saas.service;

import com.example.saas.core.TenantContext;
import com.example.saas.model.TenantInvite;
import com.example.saas.model.User;
import com.example.saas.repository.TenantInviteRepository;
import com.example.saas.repository.UserRepository;
import com.example.saas.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InviteService {

    private final TenantInviteRepository tenantInviteRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final EmailService emailService;

    @Transactional
    public TenantInvite createInvite(String email, String role) {
        UUID tenantId = TenantContext.getTenantId();

        if (tenantId == null) {
            throw new IllegalStateException("TenantContext is null. Cannot create invite outside a tenant.");
        }

        // Security: validate role is within allowed set
        java.util.Set<String> allowedRoles = java.util.Set.of("MEMBER", "TENANT_ADMIN");
        if (!allowedRoles.contains(role)) {
            throw new IllegalArgumentException("Invalid invite role. Allowed values: MEMBER, TENANT_ADMIN");
        }

        // Prevent duplicate active invites for the same email in the same tenant
        if (tenantInviteRepository.existsByTenantIdAndEmailAndUsedFalse(tenantId, email)) {
            throw new IllegalArgumentException("An active invite already exists for this email.");
        }

        TenantInvite invite = new TenantInvite();
        invite.setTenantId(tenantId);
        invite.setEmail(email);
        invite.setRole(role);
        invite.setToken(UUID.randomUUID().toString().replace("-", ""));
        invite.setExpiresAt(LocalDateTime.now().plusDays(7));
        invite.setUsed(false);

        TenantInvite saved = tenantInviteRepository.save(invite);

        auditLogService.log("INVITE_CREATED", "TENANT_INVITE", saved.getId(),
                "Created invite for email: " + email + " with role: " + role);

        // Send invite email asynchronously — never blocks this transaction
        String inviteUrl = "https://your-app.com/join?token=" + saved.getToken();
        emailService.sendInviteEmail(email, tenantId.toString(), inviteUrl);

        return saved;
    }

    public TenantInvite validateInvite(String token) {
        TenantInvite invite = tenantInviteRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invite token"));

        if (invite.isUsed()) {
            throw new IllegalArgumentException("This invite has already been used");
        }

        if (invite.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("This invite has expired");
        }

        return invite;
    }

    @Transactional
    public void consumeInvite(TenantInvite invite, User dbUser) {
        // Mark invite as used
        invite.setUsed(true);
        tenantInviteRepository.save(invite);

        // We run in a context where TenantContext might NOT be set if accepting before
        // switching.
        // AuditLogService uses current TenantContext. We temporarily set it for the
        // log.
        UUID originalTenantId = TenantContext.getTenantId();
        try {
            TenantContext.setTenantId(invite.getTenantId());
            auditLogService.log("INVITE_ACCEPTED", "TENANT_INVITE", invite.getId(),
                    "User " + dbUser.getEmail() + " accepted invite and joined with role: " + invite.getRole());
        } finally {
            if (originalTenantId != null) {
                TenantContext.setTenantId(originalTenantId);
            } else {
                TenantContext.clear();
            }
        }
    }
}
