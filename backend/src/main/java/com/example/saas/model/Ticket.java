package com.example.saas.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tickets")
public class Ticket extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "LONGTEXT")
    private String description;

    @Column(nullable = false)
    private String status;  // "Open", "In Progress", "Closed"

    @Column(nullable = false)
    private String priority; // "High", "Medium", "Low", "Urgent"

    // ✅ FIX: projectId was referenced in TicketSpecification but missing from entity
    @Column(name = "project_id")
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID projectId;

    // ✅ NEW: AI-suggested category stored at creation time
    @Column(name = "ai_category")
    private String aiCategory;

    @Column(name = "ai_suggested_priority")
    private String aiSuggestedPriority;

    @Column(name = "ai_confidence", precision = 4, scale = 2)
    private java.math.BigDecimal aiConfidence;

    @Column(name = "ai_reasoning")
    private String aiReasoning;

    @Column(name = "ai_status")
    private String aiStatus = "PENDING";

    @Column(name = "assignee_id")
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID assigneeId;

    @Column(name = "created_by")
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id", insertable = false, updatable = false)
    @JsonIgnore
    private User assignee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", insertable = false, updatable = false)
    @JsonIgnore
    private User creator;
}
