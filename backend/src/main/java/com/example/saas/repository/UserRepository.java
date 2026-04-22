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

    Optional<User> findByEmail(String email);

    boolean existsByEmailAndTenantId(String email, UUID tenantId);

    @Modifying
    @Query(value = "DELETE FROM user_tenants WHERE user_id = :userId", nativeQuery = true)
    void deleteUserTenantLinks(@Param("userId") String userId);

    @Modifying
    @Query(value = "UPDATE comments SET author_id = NULL WHERE author_id = :userId", nativeQuery = true)
    void nullifyUserComments(@Param("userId") String userId);

    @Modifying
    @Query(value = "UPDATE tickets SET assignee_id = NULL WHERE assignee_id = :userId", nativeQuery = true)
    void nullifyUserAssignedTickets(@Param("userId") String userId);

    @Modifying
    @Query(value = "UPDATE tickets SET created_by = NULL WHERE created_by = :userId", nativeQuery = true)
    void nullifyUserCreatedTickets(@Param("userId") String userId);

    @Modifying
    @Query(value = "UPDATE audit_logs SET actor_user_id = NULL WHERE actor_user_id = :userId", nativeQuery = true)
    void nullifyUserAuditLogs(@Param("userId") String userId);

    @Modifying
    @Query(value = "UPDATE projects SET owner_id = NULL WHERE owner_id = :userId", nativeQuery = true)
    void nullifyUserProjects(@Param("userId") String userId);

    @Modifying
    @Query(value = "INSERT IGNORE INTO user_tenants (user_id, tenant_id, role) VALUES (:userId, :tenantId, :role)", nativeQuery = true)
    void assignUserToTenant(@Param("userId") String userId, @Param("tenantId") String tenantId,
            @Param("role") String role);

    @Query(value = "SELECT role FROM user_tenants WHERE user_id = :userId AND tenant_id = :tenantId", nativeQuery = true)
    Optional<String> findTenantRoleForUser(@Param("userId") String userId, @Param("tenantId") String tenantId);
}
