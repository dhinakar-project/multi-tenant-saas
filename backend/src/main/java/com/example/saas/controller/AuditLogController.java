package com.example.saas.controller;

import com.example.saas.core.TenantContext;
import com.example.saas.model.AuditLog;
import com.example.saas.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public List<AuditLog> getAuditLogs() {
        // Tenant-scoped: only returns logs for the current authenticated tenant
        return auditLogRepository.findAllByTenantId(TenantContext.getTenantId());
    }
}
