package com.example.saas.controller;

import com.example.saas.model.Comment;
import com.example.saas.model.User;
import com.example.saas.repository.CommentRepository;
import com.example.saas.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tickets/{ticketId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentRepository commentRepository;
    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'MEMBER', 'ADMIN', 'USER')")
    public List<Comment> getComments(@PathVariable UUID ticketId) {
        return commentRepository.findAllByTicketIdOrderByCreatedAtAsc(ticketId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'MEMBER', 'ADMIN', 'USER')")
    public Comment addComment(@PathVariable UUID ticketId, @RequestBody Map<String, String> body) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Comment comment = new Comment();
        comment.setTicketId(ticketId);
        comment.setMessage(body.get("message"));
        comment.setAuthorId(currentUser.getId());

        Comment saved = commentRepository.save(comment);
        auditLogService.log("COMMENT_ADDED", "TICKET", ticketId, "Comment added by " + currentUser.getEmail());
        return saved;
    }
}
