package com.example.saas.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "projects")
public class Project extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "LONGTEXT")
    private String description;

    @Column(name = "owner_id")
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID ownerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", insertable = false, updatable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private User owner;
}
