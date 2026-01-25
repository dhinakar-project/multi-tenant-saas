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

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final AuditLogService auditLogService;

    // PATCH 3: Pagination support
    public Page<Ticket> getAllTickets(int page, int size, String sort, String status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, sort));

        if (status != null && !status.isEmpty()) {
            return ticketRepository.findAllByStatus(status, pageable);
        }
        return ticketRepository.findAll(pageable);
    }

    public Ticket getTicket(UUID id) {
        return ticketRepository.findById(id).orElseThrow(() -> new RuntimeException("Ticket not found"));
    }

    @Transactional
    public Ticket createTicket(String title, String description, String priority) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Ticket ticket = new Ticket();
        ticket.setTitle(title);
        ticket.setDescription(description);
        ticket.setPriority(priority);
        ticket.setStatus("Open");
        ticket.setCreatedBy(currentUser.getId());

        Ticket saved = ticketRepository.save(ticket);
        auditLogService.log("TICKET_CREATED", "TICKET", saved.getId(), "Created ticket: " + title);
        return saved;
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
