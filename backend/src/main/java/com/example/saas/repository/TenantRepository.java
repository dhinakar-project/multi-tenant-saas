package com.example.saas.repository;

import com.example.saas.model.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {
    Optional<Tenant> findBySlug(String slug);

    boolean existsBySlug(String slug);

    @Query(value = "SELECT t.* FROM tenants t " +
            "INNER JOIN user_tenants ut ON t.id = ut.tenant_id " +
            "WHERE ut.user_id = :userId " +
            "LIMIT 1", nativeQuery = true)
    Optional<Tenant> findFirstTenantByUserId(@Param("userId") UUID userId);
}
