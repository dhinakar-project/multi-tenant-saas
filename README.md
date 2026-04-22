# Multi-Tenant SaaS — Ticket Management Platform

> A production-grade, AI-powered multi-tenant ticket management system built as a final year project.

---

## Architecture Highlights

### True Multi-Tenancy
Tenant isolation is enforced **at the database query level** via Hibernate named filters, activated through Spring AOP — not just application-layer filtering. Each HTTP request carries its tenant context in a `ThreadLocal<UUID>` (via `TenantContext`) that is:
1. Set by `TenantInterceptor` from the `X-Tenant-Slug` header
2. Used by the Hibernate `@Filter` to append `WHERE tenant_id = ?` to every query
3. Cleared by `afterCompletion` so it never leaks between requests

This is verified by a dedicated integration test (`TenantIsolationTest`) that proves Tenant B cannot access Tenant A's records even when directly querying the repository.

### Clerk JWT Authentication (RS256)
Token validation uses Clerk's **JWKS endpoint** (public key cryptography — RS256). No shared secrets. The `ClerkAuthenticationFilter` fetches and caches the JWKS, verifies the JWT signature, and automatically provisions new users on their first login.

### 3-Layer RBAC
| Layer | Mechanism |
|-------|-----------|
| Route | Spring Security `authorizeHttpRequests` |
| Method | `@PreAuthorize("hasRole('TENANT_ADMIN')")` |
| UI | React context + conditional rendering |

### AI-Powered Features (Gemini 2.0 Flash)
- **Real-time categorization** — debounced 800ms call while user types the ticket title
- **Draft reply generation** — AI writes the first response for support agents
- **Semantic duplicate detection** — detects similar open tickets before submission
- **Rate limited** — Bucket4j token-bucket (20 req/min per user) prevents abuse
- **Prompt injection protection** — `sanitize()` strips `ignore previous instructions` patterns

### Async Processing
AI categorization runs in a non-blocking thread pool (`@Async`) so ticket creation is never delayed while waiting for Gemini. The ticket saves first, then categorization fires in background.

### Voice Assistant (Vapi)
A fully functional voice AI assistant powered by Vapi + Gemini 2.0. The `/api/vapi/llm` custom LLM endpoint receives OpenAI-compatible chat completion requests from Vapi servers and responds with tenant-aware ticket data.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Spring Boot 3.2, Java 17 |
| Auth | Clerk (RS256 JWT via JWKS) |
| Database | MySQL 8.0 + Flyway (12 migrations) |
| ORM | Spring Data JPA + Hibernate filters |
| AI | Google Gemini 2.0 Flash |
| Voice | Vapi (custom LLM) |
| Rate Limiting | Bucket4j (token-bucket) |
| Frontend | React 18, Vite, TailwindCSS |
| Infra | Docker Compose, Nginx, Vercel |
| Testing | JUnit 5, Mockito, Spring MockMvc, H2 |

---

## Quick Start

```bash
# 1. Copy and fill environment variables
cp .env.example .env.local
# Edit .env.local with your actual values (DB, Clerk, Gemini, Vapi keys)

# 2. Start everything with Docker Compose
docker compose up --build

# Frontend:   http://localhost:3001
# Backend:    http://localhost:8081
# Swagger UI: http://localhost:8081/swagger-ui.html
# Health:     http://localhost:8081/actuator/health
```

---

## Security Model

### Credential Management
- All secrets are injected via environment variables — no hardcoded credentials anywhere in source
- `.env.local` is in `.gitignore` and never committed
- See `.env.example` for all required variables

### Actuator Hardening
- `/actuator/health` is public (for load balancer health probes)
- All other actuator endpoints require `TENANT_ADMIN` role

### Input Validation
- All DTO fields have Bean Validation constraints (`@NotBlank`, `@Size`)
- AI prompt inputs are sanitized before reaching Gemini

### Request Tracing
Every HTTP response includes an `X-Request-ID` header (generated or forwarded) that correlates to MDC log entries for end-to-end tracing.

---

## Running Tests

```bash
cd backend
mvn test
```

Test suite includes:
| Test | What it proves |
|------|----------------|
| `TenantIsolationTest` | Tenant B cannot see Tenant A's data (core security guarantee) |
| `TicketServiceTest` | Business logic: status changes, audit logs, async categorization |
| `TicketControllerSecurityTest` | Unauthenticated requests get 401; public endpoints remain accessible |

---

## Database Schema (Flyway)

12 versioned migrations in `backend/src/main/resources/db/migration/`:

| Version | Description |
|---------|-------------|
| V1 | Initial schema (tenants, users, tickets) |
| V2–V12 | Projects, comments, audit logs, invites, AI fields, indexes |

---

## API Documentation

Swagger UI is available at `/swagger-ui.html` when the backend is running. All endpoints include request/response schemas, authorization requirements, and example values.

---

## Project Structure

```
multi_tenant_Saas_project/
├── backend/                     # Spring Boot application
│   └── src/
│       ├── main/java/com/example/saas/
│       │   ├── config/          # Security, CORS, interceptors, rate limiting
│       │   ├── controller/      # REST API controllers
│       │   ├── core/            # TenantContext (ThreadLocal)
│       │   ├── dto/             # Request/response DTOs
│       │   ├── exception/       # Typed exceptions + global handler
│       │   ├── model/           # JPA entities (with Hibernate filters)
│       │   ├── repository/      # Spring Data JPA repositories
│       │   ├── security/        # Clerk JWT filter + tenant filter
│       │   └── service/         # Business logic + AI services
│       └── test/                # Unit + integration tests
├── frontend/                    # React + Vite application
│   └── src/
│       ├── components/          # Reusable UI components
│       ├── context/             # Auth + tenant context
│       ├── pages/               # Route-level page components
│       └── api/                 # Axios API client
├── docker-compose.yml           # MySQL + Backend + Frontend
└── .env.example                 # Environment variable template
```

---

## Final Year Project Differentiators

1. **Genuine multi-tenancy** — not just `WHERE user_id = ?` filtering; Hibernate session-level filter enforced for every query
2. **Zero System.out.println** — production-ready structured logging with SLF4J + Logback, request IDs in every log line
3. **Real tests** — TenantIsolationTest is the kind of test examiners want to see because it tests the hardest part
4. **AI depth** — 4 distinct Gemini features + voice AI + rate limiting + prompt injection protection
5. **Security thinking** — typed exceptions, actuator hardening, credential externalization, input sanitization
