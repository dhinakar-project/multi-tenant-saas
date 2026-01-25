package com.example.saas.service;

import com.example.saas.core.TenantContext;
import com.example.saas.dto.TenantRegisterRequest;
import com.example.saas.dto.TenantResponse;
import com.example.saas.model.Tenant;
import com.example.saas.model.User;
import com.example.saas.repository.TenantRepository;
import com.example.saas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public TenantResponse createTenant(TenantRegisterRequest request) {
        // Check for duplicate slug - throw proper exception for 409
        if (tenantRepository.existsBySlug(request.getTenantSlug())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Tenant slug '" + request.getTenantSlug() + "' already exists");
        }

        Tenant tenant = new Tenant();
        tenant.setName(request.getTenantName());
        tenant.setSlug(request.getTenantSlug());

        tenant = tenantRepository.save(tenant);

        // Create Admin User
        TenantContext.setTenantId(tenant.getId());

        User admin = new User();
        admin.setEmail(request.getAdminEmail());
        admin.setPassword(passwordEncoder.encode(request.getAdminPassword()));
        admin.setFullName(request.getAdminName());
        admin.setRoles(Set.of("ADMIN"));

        try {
            userRepository.save(admin);
        } catch (DataIntegrityViolationException e) {
            // Email already exists for this tenant
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Email '" + request.getAdminEmail() + "' already exists");
        } finally {
            TenantContext.clear();
        }

        return new TenantResponse(tenant.getId().toString(), tenant.getSlug(), tenant.getName());
    }
}
