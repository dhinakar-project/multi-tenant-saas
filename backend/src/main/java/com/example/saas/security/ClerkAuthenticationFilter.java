package com.example.saas.security;

import com.auth0.jwt.interfaces.DecodedJWT;
import com.example.saas.core.TenantContext;
import com.example.saas.model.Tenant;
import com.example.saas.model.User;
import com.example.saas.repository.TenantRepository;
import com.example.saas.repository.UserRepository;
import com.example.saas.util.TenantHeaderUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Validates Clerk JWTs and provisions users automatically.
 * Replaces legacy JwtAuthenticationFilter.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ClerkAuthenticationFilter extends OncePerRequestFilter {

    private final ClerkJwtValidator clerkJwtValidator;
    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        // Skip public endpoints
        String path = request.getRequestURI();
        if (isPublicEndpoint(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = extractToken(request);

            if (token != null) {
                // Validate Clerk JWT
                DecodedJWT jwt = clerkJwtValidator.validateToken(token);
                String clerkUserId = clerkJwtValidator.extractClerkUserId(jwt);

                // Bootstrap endpoint doesn't require tenant context (user doesn't have one yet)
                if (path.equals("/api/tenants/bootstrap")) {
                    // Find or provision user WITHOUT tenant context
                    User user = userRepository.findByClerkUserId(clerkUserId).orElse(null);

                    if (user == null) {
                        String email = clerkJwtValidator.extractEmail(jwt);
                        if (email != null) {
                            user = userRepository.findByEmail(email).orElse(null);
                        }
                    }

                    if (user == null) {
                        user = provisionBootstrapUser(jwt);
                    }

                    // Populate Spring Security context
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(user,
                            null,
                            user.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    log.debug("Authenticated user for bootstrap: {} (Clerk ID: {})", user.getEmail(), clerkUserId);
                    filterChain.doFilter(request, response);
                    return;
                }

                // Get tenant context (required for multi-tenancy)
                String tenantSlug = TenantHeaderUtil.resolveTenantSlug(request);
                if (tenantSlug == null) {
                    log.warn("Missing X-Tenant-Slug header for authenticated request");
                    response.sendError(HttpServletResponse.SC_BAD_REQUEST, "X-Tenant-Slug header required");
                    return;
                }

                Tenant tenant = tenantRepository.findBySlug(tenantSlug)
                        .orElse(null);
                if (tenant == null) {
                    log.warn("Invalid tenant slug: {}", tenantSlug);
                    response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid tenant");
                    return;
                }

                // Set tenant context
                TenantContext.setTenantId(tenant.getId());

                // Find or provision user
                User user = userRepository.findByClerkUserId(clerkUserId).orElse(null);

                if (user == null) {
                    String email = clerkJwtValidator.extractEmail(jwt);
                    if (email != null) {
                        user = userRepository.findByEmail(email).orElse(null);
                        if (user != null) {
                            // Link existing user to Clerk ID
                            user.setClerkUserId(clerkUserId);
                            user = userRepository.save(user);
                        }
                    }
                }

                if (user == null) {
                    user = provisionUser(jwt, tenant);
                }

                // Dynamically resolve the user's role for THIS specific tenant
                String tenantRole = userRepository.findTenantRoleForUser(
                        user.getId().toString(), tenant.getId().toString()).orElse("MEMBER");

                java.util.List<org.springframework.security.core.GrantedAuthority> authorities = new java.util.ArrayList<>(
                        user.getAuthorities());
                authorities.add(
                        new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + tenantRole));

                // Populate Spring Security context
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(user, null,
                        authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.debug("Authenticated user: {} (Clerk ID: {})", user.getEmail(), clerkUserId);
            }

        } catch (SecurityException e) {
            log.error("Authentication failed: {}", e.getMessage());
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired token");
            return;
        } catch (Exception e) {
            log.error("Unexpected error in ClerkAuthenticationFilter", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Authentication error");
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Auto-provision user from Clerk JWT on first login.
     */
    private User provisionUser(DecodedJWT jwt, Tenant tenant) {
        String clerkUserId = clerkJwtValidator.extractClerkUserId(jwt);
        String email = clerkJwtValidator.extractEmail(jwt);
        String fullName = clerkJwtValidator.extractFullName(jwt);

        log.info("Auto-provisioning new user: {} (Clerk ID: {})", email, clerkUserId);

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setTenantId(tenant.getId());
        user.setClerkUserId(clerkUserId);
        user.setEmail(email != null ? email : clerkUserId + "@clerk.local");
        user.setFullName(fullName != null ? fullName : "Clerk User");
        user.setPassword(""); // No password - Clerk handles auth
        user.setActive(true);

        // Assign default role
        Set<String> roles = new LinkedHashSet<>();
        roles.add("USER_READ");
        roles.add("TICKET_READ");
        roles.add("TICKET_WRITE");
        user.setRoles(roles);

        return userRepository.save(user);
    }

    /**
     * Create a transient user from Clerk JWT during bootstrap (no tenant yet).
     * This user is NOT persisted - it's only used for authentication.
     * The actual user will be created/updated by TenantBootstrapController.
     */
    private User provisionBootstrapUser(DecodedJWT jwt) {
        String clerkUserId = clerkJwtValidator.extractClerkUserId(jwt);
        String email = clerkJwtValidator.extractEmail(jwt);
        String fullName = clerkJwtValidator.extractFullName(jwt);

        log.info("Creating transient user for bootstrap: {} (Clerk ID: {})", email, clerkUserId);

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setTenantId(null); // No tenant yet - will be assigned during bootstrap
        user.setClerkUserId(clerkUserId);
        user.setEmail(email != null ? email : clerkUserId + "@clerk.local");
        user.setFullName(fullName != null ? fullName : "Clerk User");
        user.setPassword(""); // No password - Clerk handles auth
        user.setActive(true);

        // Assign minimal role for bootstrap
        Set<String> roles = new LinkedHashSet<>();
        roles.add("USER_READ");
        user.setRoles(roles);

        // DO NOT SAVE - tenant_id is null and violates NOT NULL constraint
        // TenantBootstrapController will handle user persistence
        return user;
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private boolean isPublicEndpoint(String path) {
        // Bootstrap endpoint requires authentication (to get User object)
        if (path.equals("/api/tenants/bootstrap")) {
            return false;
        }

        // Tenant registration (POST /api/tenants) is public
        if (path.equals("/api/tenants")) {
            return true;
        }

        return path.startsWith("/api/auth") ||
                path.startsWith("/actuator") ||
                path.startsWith("/v3/api-docs") ||
                path.startsWith("/swagger-ui") ||
                path.equals("/error");
    }
}
