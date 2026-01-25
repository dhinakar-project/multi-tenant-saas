package com.example.saas.repository;

import com.example.saas.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmailAndTenantId(String email, UUID tenantId);

    boolean existsByEmailAndTenantId(String email, UUID tenantId);
}
