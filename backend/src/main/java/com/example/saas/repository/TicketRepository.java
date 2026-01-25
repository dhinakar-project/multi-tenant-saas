package com.example.saas.repository;

import com.example.saas.model.Ticket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    // PATCH 3: Pagination
    Page<Ticket> findAll(Pageable pageable);

    Page<Ticket> findAllByStatus(String status, Pageable pageable);

    Page<Ticket> findAllByPriority(String priority, Pageable pageable);

    Page<Ticket> findAllByAssigneeId(UUID assigneeId, Pageable pageable);
}
