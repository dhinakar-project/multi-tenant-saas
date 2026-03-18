package com.example.saas.repository;

import com.example.saas.model.Ticket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    // PATCH 3: Pagination
    Page<Ticket> findAll(Pageable pageable);

    Page<Ticket> findAllByStatus(String status, Pageable pageable);

    Page<Ticket> findAllByPriority(String priority, Pageable pageable);

    Page<Ticket> findAllByAssigneeId(UUID assigneeId, Pageable pageable);

    // AI Categorization — these bypass the Hibernate tenant filter since they update by ID only
    @Modifying
    @Transactional
    @Query("UPDATE Ticket t SET t.aiCategory = :category, t.aiSuggestedPriority = :priority, " +
           "t.aiConfidence = :confidence, t.aiReasoning = :reasoning, t.aiStatus = :status WHERE t.id = :id")
    void updateAiFields(@Param("id") UUID id,
                        @Param("category") String category,
                        @Param("priority") String priority,
                        @Param("confidence") java.math.BigDecimal confidence,
                        @Param("reasoning") String reasoning,
                        @Param("status") String status);

    @Modifying
    @Transactional
    @Query("UPDATE Ticket t SET t.aiStatus = :status WHERE t.id = :id")
    void updateAiStatus(@Param("id") UUID id, @Param("status") String status);
}
