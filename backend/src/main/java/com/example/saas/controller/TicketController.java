package com.example.saas.controller;

import com.example.saas.model.Ticket;
import com.example.saas.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')") // PATCH 1: Allow any role
    public Page<Ticket> getAllTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(required = false) String status) {
        // PATCH 3: Pagination integration
        return ticketService.getAllTickets(page, size, sort, status);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public Ticket getTicket(@PathVariable UUID id) {
        return ticketService.getTicket(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public Ticket createTicket(@RequestBody Map<String, String> body) {
        // PATCH 4 Warning: Should ideally be a DTO with @Valid, but keeping Map for now
        // per scope,
        // will rely on Service or future patch for strict validation.
        return ticketService.createTicket(
                body.get("title"),
                body.get("description"),
                body.get("priority"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')") // Example: Only Admin/Support can change status
    public Ticket updateStatus(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return ticketService.updateTicketStatus(id, body.get("status"));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')") // Only Admin can assign
    public Ticket assignTicket(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return ticketService.assignTicket(id, UUID.fromString(body.get("assigneeId")));
    }
}
