package com.example.saas.config;

import com.example.saas.security.ClerkAuthenticationFilter;
import com.example.saas.security.TenantFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final ClerkAuthenticationFilter clerkAuthFilter;
    private final TenantFilter tenantFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(
            org.springframework.security.config.annotation.web.builders.HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> response
                                .sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized"))
                        .accessDeniedHandler((request, response, accessDeniedException) -> response
                                .sendError(HttpServletResponse.SC_FORBIDDEN, "Forbidden")))
                .authorizeHttpRequests(auth -> auth
                        // ✅ allow CORS preflight
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ✅ public endpoints
                        .requestMatchers(HttpMethod.POST, "/api/tenants").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()

                        // ✅ dev tools
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/actuator/health").permitAll()   // Public health probe
                        .requestMatchers("/actuator/**").hasRole("TENANT_ADMIN") // Restrict sensitive actuator
                        .requestMatchers("/error").permitAll()

                        // ✅ protected endpoints — TENANT_ADMIN only
                        .requestMatchers(HttpMethod.DELETE, "/api/users/me").authenticated() // self-delete: any auth user
                        .requestMatchers("/api/admin/**").hasRole("TENANT_ADMIN")
                        .requestMatchers("/api/invites").hasRole("TENANT_ADMIN")
                        .requestMatchers("/api/users/**").hasRole("TENANT_ADMIN")
                        .requestMatchers("/api/audit-logs/**").hasRole("TENANT_ADMIN")

                        // ✅ Vapi Voice AI — /llm is public (Vapi cannot send Clerk JWT)
                        //                   /config is authenticated (frontend uses Clerk JWT)
                        .requestMatchers("/api/vapi/llm", "/api/vapi/llm/**").permitAll()
                        .requestMatchers("/api/vapi/config").authenticated()

                        .anyRequest().authenticated())
                .authenticationProvider(authenticationProvider())

                // Filter order: TenantFilter → ClerkAuthenticationFilter
                // TenantFilter sets tenant context, ClerkAuthFilter validates JWT and
                // provisions user
                .addFilterBefore(tenantFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(clerkAuthFilter, UsernamePasswordAuthenticationFilter.class)

                // optional (safe): default headers
                .httpBasic(Customizer.withDefaults());

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * CORS configuration supporting both localhost and LAN access.
     * The /api/vapi/llm endpoint uses a separate permissive config because
     * Vapi's servers call it from public IPs that are not in our localhost allowlist.
     */
    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {

        // ── 1. Permissive config for Vapi's LLM endpoint ────────────────────
        // Vapi calls /api/vapi/llm from their own servers (public IPs).
        // allowCredentials must be false when allowedOrigins is "*".
        CorsConfiguration vapiConfig = new CorsConfiguration();
        vapiConfig.setAllowedOriginPatterns(List.of("*"));
        vapiConfig.setAllowedMethods(List.of("POST", "OPTIONS"));
        vapiConfig.setAllowedHeaders(List.of("*"));
        vapiConfig.setAllowCredentials(false);

        // ── 2. Strict config for all other endpoints ─────────────────────────
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:5173",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:3001",
                "http://127.0.0.1:5173",
                "http://192.168.*.*:*",
                "http://10.*.*.*:*",
                "http://172.16.*.*:*",
                "http://172.17.*.*:*",
                "http://172.18.*.*:*",
                "http://172.19.*.*:*",
                "http://172.20.*.*:*",
                "http://172.21.*.*:*",
                "http://172.22.*.*:*",
                "http://172.23.*.*:*",
                "http://172.24.*.*:*",
                "http://172.25.*.*:*",
                "http://172.26.*.*:*",
                "http://172.27.*.*:*",
                "http://172.28.*.*:*",
                "http://172.29.*.*:*",
                "http://172.30.*.*:*",
                "http://172.31.*.*:*",
                "https://multi-tenant-saas-lilac.vercel.app",
                "https://*.vercel.app",
                "https://*.onrender.com"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Tenant-Slug"));
        configuration.setExposedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/vapi/llm", vapiConfig);
        source.registerCorsConfiguration("/api/vapi/llm/**", vapiConfig); // Cover trailing slash
        source.registerCorsConfiguration("/**", configuration);          // Everything else
        return source;
    }
}
