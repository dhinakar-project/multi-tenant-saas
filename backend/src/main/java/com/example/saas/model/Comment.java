package com.example.saas.model;

import jakarta.persistence.*;
import lombok.*;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "comments")
public class Comment extends BaseEntity {

    @Column(name = "ticket_id", nullable = false)
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID ticketId;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String message;

    @Column(name = "author_id")
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID authorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", insertable = false, updatable = false)
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", insertable = false, updatable = false)
    private User author;
}
