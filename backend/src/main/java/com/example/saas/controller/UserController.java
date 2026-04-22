package com.example.saas.controller;

import com.example.saas.core.TenantContext;
import com.example.saas.dto.UserDTO;
import com.example.saas.exception.ResourceNotFoundException;
import com.example.saas.model.User;
import com.example.saas.repository.UserRepository;
import com.example.saas.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public List<UserDTO> getUsers() {
        return userRepository.findAll().stream().map(user -> {
            UserDTO dto = new UserDTO();
            dto.setId(user.getId());
            dto.setEmail(user.getEmail());
            dto.setFullName(user.getFullName());
            dto.setActive(user.isActive());
            String role = userRepository
                    .findTenantRoleForUser(user.getId().toString(), TenantContext.getTenantId().toString())
                    .orElse("MEMBER");
            dto.setRole(role);
            return dto;
        }).collect(Collectors.toList());
    }

    /**
     * Self-delete: any authenticated user can delete their own account from the DB.
     * Removes user_tenants FK links first, then deletes the user row.
     * Clerk-side deletion is handled separately by the frontend SDK.
     */
    @Transactional
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteSelf(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }

        String userId = currentUser.getId().toString();
        log.info("[UserController] Self-delete for user: {} ({})", currentUser.getEmail(), userId);

        try {
            // 1. Remove all tenant memberships (FK constraint on user_tenants)
            userRepository.deleteUserTenantLinks(userId);
            
            // 2. Nullify references in historical data so org doesn't lose tickets/comments/projects
            userRepository.nullifyUserComments(userId);
            userRepository.nullifyUserAssignedTickets(userId);
            userRepository.nullifyUserCreatedTickets(userId);
            userRepository.nullifyUserAuditLogs(userId);
            userRepository.nullifyUserProjects(userId);

            // 3. Delete the user record itself
            userRepository.deleteById(currentUser.getId());
            log.info("[UserController] Deleted user: {}", currentUser.getEmail());
        } catch (Exception e) {
            log.error("[UserController] Failed to delete user {}: {}", userId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }

        return ResponseEntity.noContent().build(); // 204
    }

    /**
     * Admin-only: disable (soft-delete) another user in the same tenant.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ResponseEntity<Void> disableUser(@PathVariable UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        user.setActive(false);
        userRepository.save(user);
        auditLogService.log("USER_DISABLED", "USER", id, "Disabled user: " + user.getEmail());
        return ResponseEntity.ok().build();
    }
}
