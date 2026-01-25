package com.example.saas.security;

import com.example.saas.core.TenantContext;
import com.example.saas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            // Should not happen if Interceptor is working correctly for secured endpoints
            // But for Auth endpoint, we need to extract tenant first.
            // Actually, AuthController will set context before calling
            // AuthenticationManager if needed?
            // Or AuthenticationManager calls this.
            // Problem: detailed tenant logic is needed here.
            throw new UsernameNotFoundException("Tenant context not set");
        }

        return userRepository.findByEmailAndTenantId(email, tenantId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found in this tenant"));
    }
}
