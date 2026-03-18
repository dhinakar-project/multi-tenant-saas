package com.example.saas.controller;

import com.example.saas.service.MetricsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/metrics")
@RequiredArgsConstructor
public class MetricsController {

    private final MetricsService metricsService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public Map<String, Object> getDashboardMetrics() {
        return metricsService.getDashboardMetrics();
    }
}
