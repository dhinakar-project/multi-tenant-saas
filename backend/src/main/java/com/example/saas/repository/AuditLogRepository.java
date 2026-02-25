package com.example.saas.repository;

import com.example.saas.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findAllByActorUserId(UUID actorUserId);

    /** Tenant-scoped query — ensures cross-tenant isolation in audit log access */
    List<AuditLog> findAllByTenantId(UUID tenantId);
}
