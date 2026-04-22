package com.example.saas;

import com.example.saas.core.TenantContext;
import com.example.saas.model.Tenant;
import com.example.saas.model.Ticket;
import com.example.saas.repository.TenantRepository;
import com.example.saas.repository.TicketRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import com.example.saas.core.TenantFilterAspect;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * CRITICAL SECURITY TEST — Verifies that Tenant B cannot see Tenant A's data.
 *
 * This is the core security guarantee of the multi-tenant architecture.
 * The Hibernate @Filter (tenantId) must isolate all repository queries by
 * the tenant ID stored in TenantContext. If this test fails, data is leaking
 * across tenant boundaries.
 *
 * Uses @DataJpaTest with an in-memory H2 database (Flyway disabled, schema
 * managed by Hibernate's create-drop) to run fast and without Docker.
 */
@DataJpaTest
@TestPropertySource(properties = {
    "spring.flyway.enabled=false",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=MySQL",
    "spring.datasource.driver-class-name=org.h2.Driver"
})
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@Import(TenantFilterAspect.class)
@EnableAspectJAutoProxy
public class TenantIsolationTest {

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private TicketRepository ticketRepository;

    private UUID tenantAId;
    private UUID tenantBId;

    @BeforeEach
    void setUp() {
        ticketRepository.deleteAll();
        tenantRepository.deleteAll();

        Tenant tenantA = new Tenant();
        tenantA.setId(UUID.randomUUID());
        tenantA.setSlug("tenant-a");
        tenantA.setName("Tenant A");
        tenantRepository.save(tenantA);
        tenantAId = tenantA.getId();

        Tenant tenantB = new Tenant();
        tenantB.setId(UUID.randomUUID());
        tenantB.setSlug("tenant-b");
        tenantB.setName("Tenant B");
        tenantRepository.save(tenantB);
        tenantBId = tenantB.getId();

        // Create a ticket explicitly belonging to Tenant A
        Ticket ticketA = new Ticket();
        ticketA.setTitle("Tenant A Secret Ticket");
        ticketA.setStatus("Open");
        ticketA.setPriority("High");
        ticketA.setTenantId(tenantAId);
        ticketRepository.save(ticketA);

        TenantContext.clear();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @Order(1)
    void tenantA_canSee_its_own_tickets() {
        // Given Tenant A context is active
        TenantContext.setTenantId(tenantAId);

        // When querying tickets
        List<Ticket> tickets = ticketRepository.findAll();

        // Then only Tenant A tickets should be returned
        assertThat(tickets).isNotEmpty();
        assertThat(tickets).allMatch(
            t -> tenantAId.equals(t.getTenantId()),
            "All tickets returned should belong to Tenant A"
        );
    }

    @Test
    @Order(2)
    void tenantB_cannotSee_tenantA_tickets() {
        // Given Tenant B context is active (no tickets created for B)
        TenantContext.setTenantId(tenantBId);

        // When querying tickets, Tenant B should see 0 — not Tenant A's data
        List<Ticket> tickets = ticketRepository.findAll();

        // All tickets returned (if any) must belong to Tenant B only
        assertThat(tickets).allMatch(
            t -> tenantBId.equals(t.getTenantId()),
            "Tenant B must never see Tenant A's tickets — isolation breach!"
        );
    }

    @Test
    @Order(3)
    void ticketTenantId_isSetCorrectly_onCreation() {
        Ticket ticket = new Ticket();
        ticket.setTitle("Test Ticket");
        ticket.setStatus("Open");
        ticket.setPriority("Medium");
        ticket.setTenantId(tenantAId);
        Ticket saved = ticketRepository.save(ticket);

        assertThat(saved.getTenantId()).isEqualTo(tenantAId);
        assertThat(saved.getId()).isNotNull();
    }
}
