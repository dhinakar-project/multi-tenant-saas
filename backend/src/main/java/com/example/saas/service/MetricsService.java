package com.example.saas.service;

import com.example.saas.repository.ProjectRepository;
import com.example.saas.repository.TicketRepository;
import com.example.saas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MetricsService {

    private final TicketRepository ticketRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public Map<String, Object> getDashboardMetrics() {
        Map<String, Object> metrics = new HashMap<>();

        // We use pageable internally normally, but for metrics, assuming repository has
        // count methods.
        // We will do a generic count for demonstration since tenantFilter applies
        // automatically.
        long totalTickets = ticketRepository.count();
        long totalProjects = projectRepository.count();
        long activeUsers = userRepository.count();

        metrics.put("totalTickets", totalTickets);
        metrics.put("totalProjects", totalProjects);
        metrics.put("activeUsers", activeUsers);

        return metrics;
    }
}
