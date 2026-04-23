package com.example.saas.service;

import com.example.saas.model.AuditLog;
import com.example.saas.repository.AuditLogRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuditLogService Unit Tests")
class AuditLogServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditLogService auditLogService;

    @Test
    @DisplayName("log() should skip saving when TenantContext is null")
    void log_NullTenantContext_SkipsWithoutThrow() {
        // TenantContext is null by default in unit tests (no filter running)
        // The service should log a warning and return without throwing
        assertThatCode(() ->
            auditLogService.log("TEST_ACTION", "TICKET", UUID.randomUUID(), "summary")
        ).doesNotThrowAnyException();

        // Should NOT save when tenant context is null
        verify(auditLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("log() should create audit log with correct fields when TenantContext is set")
    void log_WithTenantContext_SavesCorrectFields() {
        // Arrange
        com.example.saas.core.TenantContext.setTenantId(UUID.randomUUID());
        UUID entityId = UUID.randomUUID();

        try {
            ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
            when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            auditLogService.log("TICKET_CREATED", "TICKET", entityId, "Created ticket: Test");

            // Assert
            verify(auditLogRepository).save(captor.capture());
            AuditLog saved = captor.getValue();
            assertThat(saved.getAction()).isEqualTo("TICKET_CREATED");
            assertThat(saved.getEntityType()).isEqualTo("TICKET");
            assertThat(saved.getEntityId()).isEqualTo(entityId);
            assertThat(saved.getSummary()).contains("Created ticket");
            assertThat(saved.getActorEmail()).isEqualTo("system"); // No auth in unit test
        } finally {
            com.example.saas.core.TenantContext.clear();
        }
    }

    @Test
    @DisplayName("log() should handle null entityId without throwing")
    void log_NullEntityId_DoesNotThrow() {
        com.example.saas.core.TenantContext.setTenantId(UUID.randomUUID());
        try {
            when(auditLogRepository.save(any())).thenAnswer(i -> i.getArgument(0));
            assertThatCode(() ->
                auditLogService.log("ACTION", "TYPE", null, "summary")
            ).doesNotThrowAnyException();
        } finally {
            com.example.saas.core.TenantContext.clear();
        }
    }
}
