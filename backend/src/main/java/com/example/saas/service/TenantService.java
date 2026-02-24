package com.example.saas.service;

import com.example.saas.core.TenantContext;
import com.example.saas.dto.TenantBootstrapResponse;
import com.example.saas.dto.TenantRegisterRequest;
import com.example.saas.dto.TenantResponse;
import com.example.saas.model.Tenant;
import com.example.saas.model.User;
import com.example.saas.repository.TenantRepository;
import com.example.saas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
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
        admin.setRoles(Set.of("ADMIN"));

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
    public TenantBootstrapResponse bootstrapTenant(User user) {
        // First, ensure user exists in database
        // (user might be transient from ClerkAuthenticationFilter during bootstrap)
        User dbUser = userRepository.findByClerkUserId(user.getClerkUserId())
                .orElse(null);

        // Fallback: If not found by Clerk ID, try by email.
        // Handles case where user registers through custom UI (/api/tenants) without
        // Clerk ID initially.
        if (dbUser == null && user.getEmail() != null) {
            dbUser = userRepository.findByEmail(user.getEmail()).orElse(null);
            if (dbUser != null) {
                dbUser.setClerkUserId(user.getClerkUserId());
                dbUser = userRepository.save(dbUser);
            }
        }

        if (dbUser != null) {
            // User exists - check if they already have a tenant
            Tenant existingTenant = tenantRepository.findFirstTenantByUserId(dbUser.getId())
                    .orElse(null);

            // Backward compatibility / safety net if user_tenants relationship was missed
            if (existingTenant == null && dbUser.getTenantId() != null) {
                existingTenant = tenantRepository.findById(dbUser.getTenantId()).orElse(null);
                if (existingTenant != null) {
                    assignUserToTenant(dbUser.getId(), existingTenant.getId(), "TENANT_ADMIN");
                }
            }

            if (existingTenant != null) {
                // User already has a tenant - return it
                String role = getTenantRoleForUser(dbUser.getId(), existingTenant.getId());
                return new TenantBootstrapResponse(
                        existingTenant.getSlug(),
                        existingTenant.getName(),
                        role,
                        false);
            }
        }

        // Create new tenant for user
        String tenantSlug = generateTenantSlug(user.getEmail());
        String tenantName = user.getFullName() != null ? user.getFullName() + "'s Organization" : "My Organization";

        Tenant newTenant = new Tenant();
        newTenant.setSlug(tenantSlug);
        newTenant.setName(tenantName);
        newTenant = tenantRepository.save(newTenant);

        // Create or update user with tenant_id
        if (dbUser == null) {
            // User doesn't exist - create them
            dbUser = new User();
            dbUser.setId(UUID.randomUUID());
            dbUser.setClerkUserId(user.getClerkUserId());
            dbUser.setEmail(user.getEmail());
            dbUser.setFullName(user.getFullName());
            dbUser.setPassword(""); // Clerk handles auth
            dbUser.setActive(true);
            dbUser.setTenantId(newTenant.getId()); // Set tenant_id to satisfy NOT NULL constraint

            Set<String> roles = new LinkedHashSet<>();
            roles.add("USER_READ");
            roles.add("TICKET_READ");
            roles.add("TICKET_WRITE");
            roles.add("TENANT_ADMIN");
            dbUser.setRoles(roles);

            dbUser = userRepository.save(dbUser);
        } else {
            // User exists but has no tenant - update tenant_id
            dbUser.setTenantId(newTenant.getId());
            if (!dbUser.getRoles().contains("TENANT_ADMIN")) {
                dbUser.getRoles().add("TENANT_ADMIN");
            }
            dbUser = userRepository.save(dbUser);
        }

        // Assign user to tenant in user_tenants table
        assignUserToTenant(dbUser.getId(), newTenant.getId(), "TENANT_ADMIN");

        return new TenantBootstrapResponse(
                newTenant.getSlug(),
                newTenant.getName(),
                "TENANT_ADMIN",
                true);
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
