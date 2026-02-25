package com.example.saas.controller;

import com.example.saas.core.TenantContext;
import com.example.saas.dto.UserDTO;
import com.example.saas.model.User;
import com.example.saas.repository.UserRepository;
import com.example.saas.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public List<UserDTO> getUsers() {
        // JPA Filter automatically filters by tenant
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

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public ResponseEntity<Void> disableUser(@PathVariable UUID id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(false);
        userRepository.save(user);
        auditLogService.log("USER_DISABLED", "USER", id, "Disabled user: " + user.getEmail());
        return ResponseEntity.ok().build();
    }
}
