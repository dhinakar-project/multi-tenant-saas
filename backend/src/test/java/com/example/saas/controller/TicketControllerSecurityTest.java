package com.example.saas.controller;

import com.example.saas.service.TicketService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * API Security Integration Tests.
 *
 * Verifies that:
 * 1. Protected endpoints reject unauthenticated requests (401)
 * 2. Public endpoints (tenant registration, health check) are accessible without auth
 * 3. Spring Security config is wired correctly in the full application context
 *
 * Uses H2 in-memory database so no Docker/MySQL is needed.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:securitytestdb;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.flyway.enabled=false",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "clerk.jwks-url=https://example.clerk.accounts.dev/.well-known/jwks.json",
    "clerk.issuer=https://example.clerk.accounts.dev",
    "gemini.api.key=test-key",
    "gemini.api-key=test-key",
    "gemini.model=gemini-2.0-flash",
    "vapi.public-key=test",
    "vapi.assistant-id=test",
    "vapi.backend-url=http://localhost:8080",
    "spring.datasource.username=sa",
    "spring.datasource.password="
})
class TicketControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TicketService ticketService;

    @Test
    void tickets_endpoint_requiresAuthentication_returns401() throws Exception {
        mockMvc.perform(get("/api/tickets"))
               .andExpect(status().isUnauthorized());
    }

    @Test
    void ticketById_endpoint_requiresAuthentication_returns401() throws Exception {
        mockMvc.perform(get("/api/tickets/00000000-0000-0000-0000-000000000001"))
               .andExpect(status().isUnauthorized());
    }

    @Test
    void aiSuggest_endpoint_requiresAuthentication_returns401() throws Exception {
        mockMvc.perform(post("/api/ai/suggest")
               .contentType("application/json")
               .content("{\"title\":\"test\"}"))
               .andExpect(status().isUnauthorized());
    }

    @Test
    void actuatorHealth_isPublic_returns200() throws Exception {
        mockMvc.perform(get("/actuator/health"))
               .andExpect(status().isOk());
    }

    @Test
    void tenantRegistration_isPublic_doesNotReturn401or403() throws Exception {
        // May return 400 (validation) or 500 (DB), but NOT 401 Unauthorized
        mockMvc.perform(post("/api/tenants")
               .contentType("application/json")
               .content("""
                   {
                     "tenantName": "Test Corp",
                     "tenantSlug": "test-corp",
                     "adminName": "Admin User",
                     "adminEmail": "admin@testcorp.com",
                     "adminPassword": "Password123!"
                   }
               """))
               .andExpect(result -> {
                   int statusCode = result.getResponse().getStatus();
                   assertThat(statusCode).isNotEqualTo(401).isNotEqualTo(403);
               });
    }

    @Test
    void swaggerUi_isPublic_doesNotReturn401() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
               .andExpect(result -> {
                   int statusCode = result.getResponse().getStatus();
                   assertThat(statusCode).isNotEqualTo(401).isNotEqualTo(403);
               });
    }
}
