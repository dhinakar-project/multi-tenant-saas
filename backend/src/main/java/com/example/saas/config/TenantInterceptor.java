package com.example.saas.config;

import com.example.saas.core.TenantContext;
import com.example.saas.model.Tenant;
import com.example.saas.repository.TenantRepository;
import com.example.saas.util.TenantHeaderUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class TenantInterceptor implements HandlerInterceptor {

    private final TenantRepository tenantRepository;

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull Object handler) throws Exception {
        String path = request.getRequestURI();

        // Bypass tenant validation for public endpoints
        if (path.startsWith("/v3/api-docs") ||
                path.startsWith("/swagger-ui") ||
                path.startsWith("/actuator") ||
                path.startsWith("/api/auth") || // Auth endpoints handle tenant themselves
                (path.equals("/api/tenants") && request.getMethod().equals("POST"))) { // Tenant registration
            return true;
        }

        String tenantSlug = TenantHeaderUtil.resolveTenantSlug(request);

        if (tenantSlug != null) {
            System.out.println("DEBUG_INTERCEPTOR: Resolving slug: [" + tenantSlug + "]");
            System.out.println("DEBUG_INTERCEPTOR: Slug length: " + tenantSlug.length());
            System.out.println("DEBUG_INTERCEPTOR: Exists in DB? " + tenantRepository.existsBySlug(tenantSlug));

            Tenant tenant = tenantRepository.findBySlug(tenantSlug)
                    .orElseThrow(() -> {
                        System.out.println("DEBUG_INTERCEPTOR: NOT FOUND but Exists? "
                                + tenantRepository.existsBySlug(tenantSlug));
                        return new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Tenant '" + tenantSlug + "' not found");
                    });
            TenantContext.setTenantId(tenant.getId());
        }

        return true;
    }

    @Override
    public void afterCompletion(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull Object handler, Exception ex) throws Exception {
        TenantContext.clear();
    }
}
