package com.example.saas.service;

import com.example.saas.core.TenantContext;
import com.example.saas.dto.TicketCreateRequest;
import com.example.saas.exception.ResourceNotFoundException;
import com.example.saas.model.Ticket;
import com.example.saas.model.User;
import com.example.saas.repository.TicketRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for TicketService business logic.
 * Uses Mockito to isolate from DB, security, and AI categorization concerns.
 */
@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock private TicketRepository ticketRepository;
    @Mock private AuditLogService auditLogService;
    @Mock private TicketCategorizationService ticketCategorizationService;
    @InjectMocks private TicketService ticketService;

    private User mockUser;
    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();

        mockUser = new User();
        mockUser.setId(UUID.randomUUID());
        mockUser.setEmail("test@example.com");
        mockUser.setTenantId(tenantId);

        TenantContext.setTenantId(tenantId);

        Authentication auth = mock(Authentication.class);
        lenient().when(auth.getPrincipal()).thenReturn(mockUser);
        SecurityContext sc = mock(SecurityContext.class);
        lenient().when(sc.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(sc);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    // ─── createTicket ───────────────────────────────────────────────────────

    @Test
    void createTicket_setsStatusToOpen() {
        TicketCreateRequest req = new TicketCreateRequest();
        req.setTitle("Login page broken");
        req.setDescription("Cannot log in with valid credentials");
        req.setPriority("High");

        Ticket savedTicket = new Ticket();
        savedTicket.setId(UUID.randomUUID());
        savedTicket.setStatus("Open");
        savedTicket.setTitle(req.getTitle());
        when(ticketRepository.save(any())).thenReturn(savedTicket);

        Ticket result = ticketService.createTicket(req);

        assertThat(result.getStatus()).isEqualTo("Open");
    }

    @Test
    void createTicket_callsAuditLog() {
        TicketCreateRequest req = new TicketCreateRequest();
        req.setTitle("Login page broken");
        req.setPriority("Medium");

        Ticket savedTicket = new Ticket();
        savedTicket.setId(UUID.randomUUID());
        savedTicket.setStatus("Open");
        savedTicket.setTitle(req.getTitle());
        when(ticketRepository.save(any())).thenReturn(savedTicket);

        ticketService.createTicket(req);

        verify(auditLogService).log(eq("TICKET_CREATED"), eq("TICKET"), any(UUID.class), anyString());
    }

    @Test
    void createTicket_triggersAsyncCategorization() {
        TicketCreateRequest req = new TicketCreateRequest();
        req.setTitle("Performance issue");
        req.setDescription("Slow dashboard");
        req.setPriority("Low");

        Ticket savedTicket = new Ticket();
        savedTicket.setId(UUID.randomUUID());
        savedTicket.setTitle(req.getTitle());
        savedTicket.setDescription(req.getDescription());
        when(ticketRepository.save(any())).thenReturn(savedTicket);

        ticketService.createTicket(req);

        verify(ticketCategorizationService).categorizeAsync(any(UUID.class), anyString(), any());
    }

    // ─── getTicket ──────────────────────────────────────────────────────────

    @Test
    void getTicket_throwsResourceNotFoundException_whenNotExists() {
        UUID nonExistentId = UUID.randomUUID();
        when(ticketRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ticketService.getTicket(nonExistentId))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining(nonExistentId.toString());
    }

    @Test
    void getTicket_returnsTicket_whenExists() {
        UUID ticketId = UUID.randomUUID();
        Ticket ticket = new Ticket();
        ticket.setId(ticketId);
        ticket.setTitle("Existing ticket");
        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));

        Ticket result = ticketService.getTicket(ticketId);

        assertThat(result.getId()).isEqualTo(ticketId);
    }

    // ─── updateTicketStatus ─────────────────────────────────────────────────

    @Test
    void updateTicketStatus_updatesAndAudits() {
        UUID ticketId = UUID.randomUUID();
        Ticket existing = new Ticket();
        existing.setId(ticketId);
        existing.setStatus("Open");
        existing.setTitle("Test ticket");
        existing.setPriority("Medium");
        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(existing));
        when(ticketRepository.save(any())).thenReturn(existing);

        ticketService.updateTicketStatus(ticketId, "In Progress");

        verify(auditLogService).log(
            eq("TICKET_STATUS_CHANGED"),
            eq("TICKET"),
            eq(ticketId),
            contains("Open → In Progress")
        );
    }

    @Test
    void updateTicketStatus_throwsResourceNotFound_whenTicketMissing() {
        UUID ticketId = UUID.randomUUID();
        when(ticketRepository.findById(ticketId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ticketService.updateTicketStatus(ticketId, "Closed"))
            .isInstanceOf(ResourceNotFoundException.class);
    }
}
