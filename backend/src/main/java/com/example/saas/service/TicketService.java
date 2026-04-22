package com.example.saas.service;

import com.example.saas.dto.TicketCreateRequest;
import com.example.saas.exception.ResourceNotFoundException;
import com.example.saas.model.Ticket;
import com.example.saas.model.User;
import com.example.saas.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final AuditLogService auditLogService;
    private final TicketCategorizationService ticketCategorizationService;

    @Transactional(readOnly = true)
    public Page<Ticket> getAllTickets(int page, int size, String sort, String status) {
        log.info("getAllTickets | page={}, size={}, status={}", page, size, status);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, sort));

        if (status != null && !status.isEmpty()) {
            return ticketRepository.findAllByStatus(status, pageable);
        }
        return ticketRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Ticket getTicket(UUID id) {
        return ticketRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Ticket", id));
    }

    @Transactional
    public Ticket createTicket(TicketCreateRequest request) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        log.info("createTicket | user={}, tenantId={}", currentUser.getId(),
            com.example.saas.core.TenantContext.getTenantId());

        Ticket ticket = new Ticket();
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setPriority(request.getPriority());
        ticket.setStatus("Open");
        ticket.setCreatedBy(currentUser.getId());
        ticket.setProjectId(request.getProjectId());   // ✅ now persisted
        ticket.setAiCategory(request.getAiCategory()); // ✅ AI suggestion stored
        ticket.setAiStatus("PENDING");

        Ticket saved = ticketRepository.save(ticket);
        auditLogService.log("TICKET_CREATED", "TICKET", saved.getId(),
            "Created ticket: " + request.getTitle() +
                (request.getAiCategory() != null ? " [AI category: " + request.getAiCategory() + "]" : ""));

        // Trigger async AI categorization (runs in background thread pool)
        ticketCategorizationService.categorizeAsync(saved.getId(), saved.getTitle(), saved.getDescription());

        return saved;
    }

    @Transactional
    public Ticket updateTicketStatus(UUID id, String status) {
        Ticket ticket = getTicket(id);
        String oldStatus = ticket.getStatus();
        ticket.setStatus(status);
        Ticket saved = ticketRepository.save(ticket);
        auditLogService.log("TICKET_STATUS_CHANGED", "TICKET", saved.getId(),
            "Status: " + oldStatus + " → " + status);
        return saved;
    }

    @Transactional
    public Ticket assignTicket(UUID id, UUID assigneeId) {
        Ticket ticket = getTicket(id);
        ticket.setAssigneeId(assigneeId);
        Ticket saved = ticketRepository.save(ticket);
        auditLogService.log("TICKET_ASSIGNED", "TICKET", saved.getId(),
            "Assigned to: " + assigneeId);
        return saved;
    }
}
