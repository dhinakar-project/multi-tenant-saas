package com.example.saas.controller;

import com.example.saas.core.TenantContext;
import com.example.saas.model.User;
import com.example.saas.repository.UserRepository;
import com.example.saas.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasAuthority('USER_READ')")
    public List<User> getUsers() {
        // JPA Filter automatically filters by tenant
        return userRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('USER_WRITE')")
    public User createUser(@RequestBody Map<String, Object> body) {
        User user = new User();
        user.setEmail((String) body.get("email"));
        user.setPassword(passwordEncoder.encode((String) body.get("password")));
        user.setFullName((String) body.get("fullName"));
        user.setRoles(Set.of(((String) body.get("role")).split(","))); // Simple role parsing

        User saved = userRepository.save(user);
        auditLogService.log("USER_CREATED", "USER", saved.getId(), "Created user: " + saved.getEmail());
        return saved;
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_WRITE')")
    public ResponseEntity<Void> disableUser(@PathVariable UUID id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(false);
        userRepository.save(user);
        auditLogService.log("USER_DISABLED", "USER", id, "Disabled user: " + user.getEmail());
        return ResponseEntity.ok().build();
    }
}
