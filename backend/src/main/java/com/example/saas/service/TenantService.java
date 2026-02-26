package com.example.saas.service;

import com.example.saas.core.TenantContext;
import com.example.saas.model.TenantInvite;
import com.example.saas.service.InviteService;
import com.example.saas.dto.TenantBootstrapResponse;
import com.example.saas.dto.TenantRegisterRequest;
import com.example.saas.dto.TenantResponse;
import com.example.saas.model.Tenant;
import com.example.saas.model.User;
import com.example.saas.repository.TenantRepository;
import com.example.saas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Lazy
    private final InviteService inviteService;

    @Transactional
    public TenantResponse createTenant(TenantRegisterRequest request) {
        // Check for duplicate slug - throw proper exception for 409
        if (tenantRepository.existsBySlug(request.getTenantSlug())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Tenant slug '" + request.getTenantSlug() + "' already exists");
        }

        Tenant tenant = new Tenant();
        tenant.setName(request.getTenantName());
        tenant.setSlug(request.getTenantSlug());

        tenant = tenantRepository.save(tenant);

        // Create Admin User
        TenantContext.setTenantId(tenant.getId());

        User admin = new User();
        admin.setEmail(request.getAdminEmail());
        admin.setPassword(passwordEncoder.encode(request.getAdminPassword()));
        admin.setFullName(request.getAdminName());

        try {
            userRepository.save(admin);
            // Ensure the relation is created in user_tenants table immediately upon
            // registration
            assignUserToTenant(admin.getId(), tenant.getId(), "TENANT_ADMIN");
        } catch (DataIntegrityViolationException e) {
            // Email already exists for this tenant
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Email '" + request.getAdminEmail() + "' already exists");
        } finally {
            TenantContext.clear();
        }

        return new TenantResponse(tenant.getId().toString(), tenant.getSlug(), tenant.getName());
    }

    /**
     * Bootstrap tenant for authenticated Clerk user.
     * Creates tenant if user has none, or returns existing tenant.
     * Idempotent - safe to call multiple times.
     */
    @Transactional
    public TenantBootstrapResponse bootstrapTenant(User user, String inviteToken) {
        // Step 1: Ensure user exists in database or create transient entity
        User dbUser = userRepository.findByClerkUserId(user.getClerkUserId()).orElse(null);

        if (dbUser == null && user.getEmail() != null) {
            dbUser = userRepository.findByEmail(user.getEmail()).orElse(null);
            if (dbUser != null) {
                dbUser.setClerkUserId(user.getClerkUserId());
                dbUser = userRepository.save(dbUser);
            }
        }

        boolean isNewUser = (dbUser == null);
        if (isNewUser) {
            dbUser = new User();
            dbUser.setId(UUID.randomUUID());
            dbUser.setClerkUserId(user.getClerkUserId());
            dbUser.setEmail(user.getEmail());
            dbUser.setFullName(user.getFullName());
            dbUser.setPassword(""); // Clerk handles auth
            dbUser.setActive(true);
        }

        Tenant targetTenant = null;
        String role = null;
        boolean isNewTenant = false;
        com.example.saas.model.TenantInvite validInvite = null;

        // Step 2: Determine target tenant
        if (inviteToken != null && !inviteToken.isBlank()) {
            // If invite provided, validate it first
            validInvite = inviteService.validateInvite(inviteToken);
            targetTenant = tenantRepository.findById(validInvite.getTenantId())
                    .orElseThrow(() -> new IllegalStateException("Invited tenant no longer exists"));
            role = validInvite.getRole();
        } else if (!isNewUser) {
            // No invite, check if user already has a tenant
            targetTenant = tenantRepository.findFirstTenantByUserId(dbUser.getId()).orElse(null);

            // Backward compatibility / safety net
            if (targetTenant == null && dbUser.getTenantId() != null) {
                targetTenant = tenantRepository.findById(dbUser.getTenantId()).orElse(null);
                if (targetTenant != null) {
                    assignUserToTenant(dbUser.getId(), targetTenant.getId(), "TENANT_ADMIN");
                }
            }

            if (targetTenant != null) {
                role = getTenantRoleForUser(dbUser.getId(), targetTenant.getId());
            }
        }

        // If still no target tenant, create a new personal tenant
        if (targetTenant == null) {
            String tenantSlug = generateTenantSlug(dbUser.getEmail());
            String tenantName = dbUser.getFullName() != null ? dbUser.getFullName() + "'s Organization"
                    : "My Organization";

            targetTenant = new Tenant();
            targetTenant.setSlug(tenantSlug);
            targetTenant.setName(tenantName);
            targetTenant = tenantRepository.save(targetTenant);
            role = "TENANT_ADMIN";
            isNewTenant = true;
        }

        // Step 3: Ensure User is persisted with the correct tenant_id
        dbUser.setTenantId(targetTenant.getId());
        dbUser = userRepository.save(dbUser); // Persists or updates the user

        // Step 4: Ensure user_tenants relationship exists
        // (Even if they already existed, ensure the role is set for the target tenant)
        assignUserToTenant(dbUser.getId(), targetTenant.getId(), role);

        // Step 5: Consume invite if one was used
        if (validInvite != null) {
            inviteService.consumeInvite(validInvite, dbUser);
        }

        return new TenantBootstrapResponse(
                targetTenant.getSlug(),
                targetTenant.getName(),
                role,
                isNewTenant);
    }

    private String generateTenantSlug(String email) {
        // Generate slug from email: user@example.com -> user-org
        String baseSlug = email.split("@")[0].toLowerCase().replaceAll("[^a-z0-9]", "-");
        String slug = baseSlug + "-org";

        // Ensure uniqueness
        int counter = 1;
        while (tenantRepository.existsBySlug(slug)) {
            slug = baseSlug + "-org-" + counter++;
        }

        return slug;
    }

    private void assignUserToTenant(UUID userId, UUID tenantId, String role) {
        userRepository.assignUserToTenant(userId.toString(), tenantId.toString(), role);
    }

    private String getTenantRoleForUser(UUID userId, UUID tenantId) {
        return userRepository.findTenantRoleForUser(userId.toString(), tenantId.toString())
                .orElse("MEMBER");
    }
}
