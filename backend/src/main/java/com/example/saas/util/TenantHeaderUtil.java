package com.example.saas.util;

import jakarta.servlet.http.HttpServletRequest;

public final class TenantHeaderUtil {
    private TenantHeaderUtil() {}

    public static String resolveTenantSlug(HttpServletRequest request) {
        if (request == null) return null;

        String slug = request.getHeader("X-Tenant-Slug");
        if (slug == null || slug.isBlank()) slug = request.getHeader("x-tenant-slug");

        if (slug != null) slug = slug.trim();
        return (slug == null || slug.isBlank()) ? null : slug;
    }
}

