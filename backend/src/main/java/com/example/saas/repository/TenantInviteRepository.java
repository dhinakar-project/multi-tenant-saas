package com.example.saas.repository;

import com.example.saas.model.TenantInvite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantInviteRepository extends JpaRepository<TenantInvite, UUID> {

    Optional<TenantInvite> findByToken(String token);

    boolean existsByTenantIdAndEmailAndUsedFalse(UUID tenantId, String email);
}
