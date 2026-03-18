package com.example.saas.controller;

import com.example.saas.dto.TicketCreateRequest;
import com.example.saas.model.Ticket;
import com.example.saas.service.TicketCategorizationService;
import com.example.saas.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final TicketCategorizationService ticketCategorizationService;

    @GetMapping
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'MEMBER')")
    public Page<Ticket> getAllTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(required = false) String status) {
        return ticketService.getAllTickets(page, size, sort, status);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'MEMBER')")
    public Ticket getTicket(@PathVariable UUID id) {
        return ticketService.getTicket(id);
    }

    // ✅ Fixed: Now uses validated TicketCreateRequest DTO instead of raw Map<String,String>
    @PostMapping
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'MEMBER')")
    public Ticket createTicket(@Valid @RequestBody TicketCreateRequest request) {
        log.info("POST /api/tickets | title='{}', priority='{}', projectId={}",
            request.getTitle(), request.getPriority(), request.getProjectId());
        return ticketService.createTicket(request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public Ticket updateStatus(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return ticketService.updateTicketStatus(id, body.get("status"));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public Ticket assignTicket(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return ticketService.assignTicket(id, UUID.fromString(body.get("assigneeId")));
    }

    @PostMapping("/{id}/categorize")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'MEMBER')")
    public ResponseEntity<Map<String, String>> recategorize(@PathVariable UUID id) {
        Ticket ticket = ticketService.getTicket(id);
        ticketCategorizationService.categorizeAsync(id, ticket.getTitle(), ticket.getDescription());
        return ResponseEntity.accepted().body(Map.of("message", "Categorization triggered"));
    }
}
