package com.example.saas.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * EmailService — sends transactional emails via Resend API.
 *
 * If RESEND_API_KEY is not set, all sends are no-ops (logged as warnings).
 * Email failures NEVER propagate to the caller — they are always caught internally.
 * All methods are @Async so they never block the calling thread.
 */
@Slf4j
@Service
public class EmailService {

    @Value("${resend.api-key:}")
    private String resendApiKey;

    @Value("${resend.from-email:noreply@yourdomain.com}")
    private String fromEmail;

    private static final String RESEND_API_URL = "https://api.resend.com/emails";

    private final WebClient webClient = WebClient.builder()
        .defaultHeader("Content-Type", "application/json")
        .build();

    @Async
    public void sendTicketAssignedEmail(String toEmail, String ticketTitle, String ticketUrl) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.warn("Resend API key not configured — skipping ticket assignment email to {}", toEmail);
            return;
        }
        try {
            send(toEmail,
                "New ticket assigned: " + ticketTitle,
                buildTicketEmailHtml(ticketTitle, ticketUrl));
            log.info("Ticket assignment email sent to {}", toEmail);
        } catch (Exception e) {
            // Email failure must NEVER break ticket creation flow
            log.error("Failed to send ticket assignment email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendInviteEmail(String toEmail, String tenantName, String inviteUrl) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.warn("Resend API key not configured — skipping invite email to {}", toEmail);
            return;
        }
        try {
            send(toEmail,
                "You've been invited to join " + tenantName,
                buildInviteEmailHtml(tenantName, inviteUrl));
            log.info("Invite email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send invite email to {}: {}", toEmail, e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────

    private void send(String to, String subject, String html) {
        Map<String, Object> payload = Map.of(
            "from", fromEmail,
            "to", List.of(to),
            "subject", subject,
            "html", html
        );

        String response = webClient.post()
            .uri(RESEND_API_URL)
            .header("Authorization", "Bearer " + resendApiKey)
            .bodyValue(payload)
            .retrieve()
            .onStatus(
                status -> status.is4xxClientError() || status.is5xxServerError(),
                resp -> resp.bodyToMono(String.class)
                    .flatMap(body -> Mono.error(new RuntimeException("Resend API error: " + body)))
            )
            .bodyToMono(String.class)
            .block();

        log.debug("Resend API response: {}", response);
    }

    private String buildTicketEmailHtml(String title, String url) {
        return """
            <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;border-radius:16px;padding:32px">
              <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;font-size:24px">◆</div>
              <h2 style="color:#f1f5f9;margin:0 0 12px;font-size:20px;font-weight:800">New ticket assigned to you</h2>
              <p style="color:#94a3b8;margin:0 0 24px;font-size:15px;line-height:1.6">%s</p>
              <a href="%s" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">View Ticket →</a>
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:32px 0">
              <p style="color:#334155;font-size:12px;margin:0">SaaS Tickets · Multi-Tenant AI-Powered Ticketing Platform</p>
            </div>
            """.formatted(title, url);
    }

    private String buildInviteEmailHtml(String tenantName, String inviteUrl) {
        return """
            <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;border-radius:16px;padding:32px">
              <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;font-size:24px">◆</div>
              <h2 style="color:#f1f5f9;margin:0 0 12px;font-size:20px;font-weight:800">You've been invited to join %s</h2>
              <p style="color:#94a3b8;margin:0 0 24px;font-size:15px;line-height:1.6">
                You've been invited to collaborate on the <strong style="color:#a78bfa">%s</strong> workspace.
                Click the button below to accept your invitation.
              </p>
              <a href="%s" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">Accept Invitation →</a>
              <p style="color:#334155;font-size:12px;margin:24px 0 0">This invitation expires in 7 days. If you did not request this, you can safely ignore this email.</p>
            </div>
            """.formatted(tenantName, tenantName, inviteUrl);
    }
}
