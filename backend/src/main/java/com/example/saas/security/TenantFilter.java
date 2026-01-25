package com.example.saas.security;

import com.example.saas.core.TenantContext;
import com.example.saas.model.Tenant;
import com.example.saas.repository.TenantRepository;
import com.example.saas.util.TenantHeaderUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class TenantFilter extends OncePerRequestFilter {

    private final TenantRepository tenantRepository;

    /**
     * Skip filter for OPTIONS preflight, public endpoints, and infrastructure paths.
     * This ensures CORS preflight requests are not blocked before CORS headers are added.
     */
    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();

        // Skip OPTIONS preflight requests (CORS handles these)
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }

        // Skip public endpoints that don't require tenant context
        if (path.startsWith("/api/tenants") && "POST".equalsIgnoreCase(method)) {
            return true; // Tenant registration is public
        }

        if (path.startsWith("/api/auth/")) {
            return true; // Auth endpoints handle tenant context themselves
        }

        // Skip infrastructure endpoints
        if (path.startsWith("/actuator")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/error")) {
            return true;
        }

        return false;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        String tenantSlug = TenantHeaderUtil.resolveTenantSlug(request);

        if (tenantSlug != null) {
            try {
                Tenant tenant = tenantRepository.findBySlug(tenantSlug).orElse(null);
                if (tenant != null) {
                    TenantContext.setTenantId(tenant.getId());
                }
                // If tenant not found, proceed without setting context
                // Downstream logic (e.g., UserDetailsService) will handle missing tenant gracefully
            } catch (Exception e) {
                // Log error if needed, but proceed
            }
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
