package com.example.saas.controller;

import com.example.saas.dto.TenantRegisterRequest;
import com.example.saas.dto.TenantResponse;
import com.example.saas.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;

    @PostMapping
    public ResponseEntity<TenantResponse> registerTenant(@RequestBody TenantRegisterRequest request) {
        return ResponseEntity.ok(tenantService.createTenant(request));
    }
}
