
# Multi-Tenant SaaS Prototype

A production-ready prototype for a Secure Multi-Tenant Issue/Ticket Management SaaS.

## Tech Stack
-   **Backend**: Spring Boot 3, Java 17, PostgreSQL, Flyway, Spring Security
-   **Frontend**: React (Vite), TailwindCSS, Axios
-   **Infrastructure**: Docker Compose

## Quick Start (Demo Guide)

### 1. Run the Backend
You can run the backend via Docker or locally.

**Ideally, use Docker for everything:**
```bash
docker compose up --build
```

**Or run backend locally:**
```bash
cd backend
mvn spring-boot:run
```
(Ensure a PostgreSQL database is running on port 5432 with user/pass `postgres`/`postgres` and db `saas_db`).

### 2. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

### 3. Usage & Seeding
There is no default tenant/user seed by default (clean slate).

**Step 1: Sign Up (Tenant Creation)**
1.  Go to `http://localhost:5173/signup`.
2.  Use a unique slug (e.g., `acme-corp`).
3.  Fill in admin details.
4.  Submit -> You will be auto-redirected to Login.

**Step 2: Login**
1.  The "Tenant Slug" field will be prefilled.
2.  Enter the email/password you just created.
3.  You are now authenticated for that specific tenant!

### 4. API Testing (cURL)

**Signup a new Tenant:**
```bash
curl -X POST http://localhost:8080/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Acme Corp",
    "tenantSlug": "acme-test",
    "adminName": "Alice Admin",
    "adminEmail": "alice@acme.com",
    "adminPassword": "Password123!"
  }'
```

**Login (Get Token):**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@acme.com",
    "password": "Password123!"
  }'
```
*Response will contain a `token`.*

**Access Protected Resource:**
```bash
curl -X GET http://localhost:8080/api/users \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "X-Tenant-Slug: acme-test"
```
