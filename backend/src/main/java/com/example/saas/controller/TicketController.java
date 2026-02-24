package com.example.saas.controller;

import com.example.saas.model.Ticket;
import com.example.saas.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @GetMapping
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'MEMBER', 'ADMIN', 'USER')")
    public Page<Ticket> getAllTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(required = false) String status) {
        // PATCH 3: Pagination integration
        return ticketService.getAllTickets(page, size, sort, status);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'MEMBER', 'ADMIN', 'USER')")
    public Ticket getTicket(@PathVariable UUID id) {
        return ticketService.getTicket(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'MEMBER', 'ADMIN', 'USER')")
    public Ticket createTicket(@RequestBody Map<String, String> body) {
        log.info("Received POST /api/tickets with body: {}", body);
        Ticket created = ticketService.createTicket(
                body.get("title"),
                body.get("description"),
                body.get("priority"));
        log.info("Successfully returned from ticketService.createTicket, ID: {}", created.getId());
        return created;
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'ADMIN', 'SUPPORT')")
    public Ticket updateStatus(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return ticketService.updateTicketStatus(id, body.get("status"));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'ADMIN')")
    public Ticket assignTicket(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return ticketService.assignTicket(id, UUID.fromString(body.get("assigneeId")));
    }
}
