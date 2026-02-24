package com.example.saas.service;

import com.example.saas.model.Ticket;
import com.example.saas.model.User;
import com.example.saas.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final AuditLogService auditLogService;

    // PATCH 3: Pagination support
    public Page<Ticket> getAllTickets(int page, int size, String sort, String status) {
        log.info("TicketService.getAllTickets called. Page: {}, Size: {}, Status: {}", page, size, status);
        log.info("Current TenantContext ID before fetch: {}", com.example.saas.core.TenantContext.getTenantId());

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, sort));

        Page<Ticket> result;
        if (status != null && !status.isEmpty()) {
            result = ticketRepository.findAllByStatus(status, pageable);
        } else {
            result = ticketRepository.findAll(pageable);
        }

        log.info("Tickets retrieved: {}", result.getTotalElements());
        return result;
    }

    public Ticket getTicket(UUID id) {
        return ticketRepository.findById(id).orElseThrow(() -> new RuntimeException("Ticket not found"));
    }

    @Transactional
    public Ticket createTicket(String title, String description, String priority) {
        log.info("TicketService.createTicket called. Title: {}, Priority: {}", title, priority);
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        log.info("Current user: {} (ID: {})", currentUser.getUsername(), currentUser.getId());

        // Ensure tenantId exists
        log.info("Current TenantContext ID: {}", com.example.saas.core.TenantContext.getTenantId());

        Ticket ticket = new Ticket();
        ticket.setTitle(title);
        ticket.setDescription(description);
        ticket.setPriority(priority);
        ticket.setStatus("Open");
        ticket.setCreatedBy(currentUser.getId());

        log.info("Saving ticket to repository...");
        try {
            Ticket saved = ticketRepository.save(ticket);
            log.info("Ticket saved successfully with ID: {}", saved.getId());
            auditLogService.log("TICKET_CREATED", "TICKET", saved.getId(), "Created ticket: " + title);
            return saved;
        } catch (Exception e) {
            log.error("Exception occurred while saving ticket!", e);
            throw e;
        }
    }

    @Transactional
    public Ticket updateTicketStatus(UUID id, String status) {
        Ticket ticket = getTicket(id);
        String oldStatus = ticket.getStatus();
        ticket.setStatus(status);
        Ticket saved = ticketRepository.save(ticket);
        auditLogService.log("TICKET_STATUS_CHANGED", "TICKET", saved.getId(),
                "Status changed from " + oldStatus + " to " + status);
        return saved;
    }

    @Transactional
    public Ticket assignTicket(UUID id, UUID assigneeId) {
        Ticket ticket = getTicket(id);
        ticket.setAssigneeId(assigneeId);
        Ticket saved = ticketRepository.save(ticket);
        auditLogService.log("TICKET_ASSIGNED", "TICKET", saved.getId(), "Assigned to user ID: " + assigneeId);
        return saved;
    }
}
