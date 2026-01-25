package com.example.saas.controller;

import com.example.saas.core.TenantContext;
import com.example.saas.dto.AuthenticationRequest;
import com.example.saas.dto.AuthenticationResponse;
import com.example.saas.model.Tenant;
import com.example.saas.model.User;
import com.example.saas.repository.TenantRepository;
import com.example.saas.repository.UserRepository;
import com.example.saas.security.JwtService;
import com.example.saas.util.TenantHeaderUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final TenantRepository tenantRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthenticationRequest request, HttpServletRequest httpRequest) {
        // Resolve tenant slug from header (case-insensitive)
        String tenantSlug = TenantHeaderUtil.resolveTenantSlug(httpRequest);
        log.info("Auth login request, tenantSlug={}", tenantSlug);
        
        if (tenantSlug == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", "X-Tenant-Slug header is required"));
        }

        // Resolve tenant and set context
        Tenant tenant = tenantRepository.findBySlug(tenantSlug)
                .orElse(null);
        if (tenant == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", "Invalid tenant slug"));
        }

        TenantContext.setTenantId(tenant.getId());

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

            User user = userRepository.findByEmailAndTenantId(request.getEmail(), TenantContext.getTenantId())
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));

            String jwtToken = jwtService.generateToken(user);

            return ResponseEntity.ok(new AuthenticationResponse(
                    jwtToken,
                    "dummy_refresh_token",
                    user.getFullName(),
                    user.getRoles()));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "Invalid email or password"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "Authentication failed"));
        } finally {
            TenantContext.clear();
        }
    }
}
