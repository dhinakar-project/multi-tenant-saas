package com.example.saas.service;

import com.example.saas.model.Ticket;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.time.LocalDateTime;

public class TicketSpecification {

    public static Specification<Ticket> buildSearchSpecification(
            String status,
            String priority,
            UUID assigneeId,
            UUID projectId,
            String search,
            LocalDateTime startDate,
            LocalDateTime endDate) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(status)) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (StringUtils.hasText(priority)) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }

            if (assigneeId != null) {
                predicates.add(cb.equal(root.get("assigneeId"), assigneeId));
            }

            if (projectId != null) {
                predicates.add(cb.equal(root.get("projectId"), projectId));
            }

            if (StringUtils.hasText(search)) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                Predicate titlePredicate = cb.like(cb.lower(root.get("title")), searchPattern);
                Predicate descPredicate = cb.like(cb.lower(root.get("description")), searchPattern);
                predicates.add(cb.or(titlePredicate, descPredicate));
            }

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }

            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
