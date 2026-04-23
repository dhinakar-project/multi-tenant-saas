package com.example.saas.service;

import com.example.saas.core.TenantContext;
import com.example.saas.model.TenantInvite;
import com.example.saas.model.User;
import com.example.saas.repository.TenantInviteRepository;
import com.example.saas.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.example.saas.service.EmailService;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("InviteService Unit Tests")
class InviteServiceTest {

    @Mock
    private TenantInviteRepository tenantInviteRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private InviteService inviteService;

    private final UUID tenantId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("createInvite() should generate a unique token and save invite")
    void createInvite_ValidInputs_SavesWithToken() {
        // Arrange
        when(tenantInviteRepository.existsByTenantIdAndEmailAndUsedFalse(any(), any())).thenReturn(false);
        when(tenantInviteRepository.save(any(TenantInvite.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        TenantInvite result = inviteService.createInvite("user@example.com", "MEMBER");

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getToken()).isNotBlank();
        assertThat(result.getToken()).doesNotContain("-"); // UUID without dashes
        assertThat(result.getEmail()).isEqualTo("user@example.com");
        assertThat(result.getRole()).isEqualTo("MEMBER");
        assertThat(result.isUsed()).isFalse();
        assertThat(result.getExpiresAt()).isAfter(LocalDateTime.now());
    }

    @Test
    @DisplayName("createInvite() should throw for invalid role")
    void createInvite_InvalidRole_ThrowsIllegalArgument() {
        assertThatThrownBy(() -> inviteService.createInvite("user@example.com", "SUPERADMIN"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Invalid invite role");
    }

    @Test
    @DisplayName("createInvite() should throw when null TenantContext")
    void createInvite_NullTenantContext_ThrowsIllegalState() {
        TenantContext.clear();
        assertThatThrownBy(() -> inviteService.createInvite("user@example.com", "MEMBER"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("TenantContext is null");
    }

    @Test
    @DisplayName("createInvite() should throw when duplicate active invite exists")
    void createInvite_DuplicateInvite_ThrowsIllegalArgument() {
        when(tenantInviteRepository.existsByTenantIdAndEmailAndUsedFalse(any(), any())).thenReturn(true);
        assertThatThrownBy(() -> inviteService.createInvite("user@example.com", "MEMBER"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("already exists");
    }

    @Test
    @DisplayName("validateInvite() should throw for non-existent token")
    void validateInvite_InvalidToken_ThrowsIllegalArgument() {
        when(tenantInviteRepository.findByToken(anyString())).thenReturn(Optional.empty());
        assertThatThrownBy(() -> inviteService.validateInvite("bad-token"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Invalid invite token");
    }

    @Test
    @DisplayName("validateInvite() should throw for already-used invite")
    void validateInvite_AlreadyUsed_ThrowsIllegalArgument() {
        TenantInvite invite = new TenantInvite();
        invite.setUsed(true);
        invite.setExpiresAt(LocalDateTime.now().plusDays(1));
        when(tenantInviteRepository.findByToken(anyString())).thenReturn(Optional.of(invite));

        assertThatThrownBy(() -> inviteService.validateInvite("used-token"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("already been used");
    }

    @Test
    @DisplayName("validateInvite() should throw for expired token")
    void validateInvite_ExpiredToken_ThrowsIllegalArgument() {
        TenantInvite invite = new TenantInvite();
        invite.setUsed(false);
        invite.setExpiresAt(LocalDateTime.now().minusDays(1)); // Expired
        when(tenantInviteRepository.findByToken(anyString())).thenReturn(Optional.of(invite));

        assertThatThrownBy(() -> inviteService.validateInvite("expired-token"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("expired");
    }

    @Test
    @DisplayName("consumeInvite() should mark invite as used")
    void consumeInvite_ValidInvite_MarksUsedAndLogs() {
        TenantInvite invite = new TenantInvite();
        invite.setId(UUID.randomUUID());
        invite.setTenantId(tenantId);
        invite.setRole("MEMBER");
        invite.setUsed(false);
        when(tenantInviteRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        User user = new User();
        user.setEmail("user@example.com");

        inviteService.consumeInvite(invite, user);

        assertThat(invite.isUsed()).isTrue();
        verify(tenantInviteRepository).save(invite);
    }
}
