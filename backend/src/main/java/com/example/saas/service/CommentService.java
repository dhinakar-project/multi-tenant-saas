package com.example.saas.service;

import com.example.saas.model.Comment;
import com.example.saas.model.User;
import com.example.saas.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final AuditLogService auditLogService;

    public List<Comment> getCommentsByTicketId(UUID ticketId) {
        return commentRepository.findAllByTicketIdOrderByCreatedAtAsc(ticketId);
    }

    @Transactional
    public Comment addComment(UUID ticketId, String message) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Comment comment = new Comment();
        comment.setTicketId(ticketId);
        comment.setMessage(message);
        comment.setAuthorId(currentUser.getId());

        Comment saved = commentRepository.save(comment);
        auditLogService.log("COMMENT_ADDED", "TICKET", ticketId, "Added comment: " + message);
        return saved;
    }
}
