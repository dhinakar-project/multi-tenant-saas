package com.example.saas.repository;

import com.example.saas.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmailAndTenantId(String email, UUID tenantId);

    Optional<User> findByClerkUserId(String clerkUserId);

    boolean existsByEmailAndTenantId(String email, UUID tenantId);

    @Modifying
    @Query(value = "INSERT INTO user_tenants (user_id, tenant_id, role) VALUES (:userId, :tenantId, :role)", nativeQuery = true)
    void assignUserToTenant(@Param("userId") String userId, @Param("tenantId") String tenantId,
            @Param("role") String role);

    @Query(value = "SELECT role FROM user_tenants WHERE user_id = :userId AND tenant_id = :tenantId", nativeQuery = true)
    Optional<String> findTenantRoleForUser(@Param("userId") String userId, @Param("tenantId") String tenantId);
}
