package com.example.saas.service;

import com.example.saas.core.TenantContext;
import com.example.saas.model.AuditLog;
import com.example.saas.model.User;
import com.example.saas.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void log(String action, String entityType, UUID entityId, String summary) {
        if (TenantContext.getTenantId() == null)
            return; // Cannot log if no tenant context

        User actor = null;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User) {
            actor = (User) auth.getPrincipal();
        }

        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setSummary(summary);
        log.setActorUserId(actor != null ? actor.getId() : null);
        log.setActorEmail(actor != null ? actor.getEmail() : "system");
        // log.setIpAddress(null); // Need Request Context to get IP

        auditLogRepository.save(log);
    }
}
