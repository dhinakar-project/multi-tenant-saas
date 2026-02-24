# Multi-Tenant SaaS Project - Fixes Summary

## Issues Fixed

### A) Schema Mismatch - Comments Table Missing `updated_at` Column

**Problem:**
- `Comment` entity extends `BaseEntity` which has `@LastModifiedDate` on `updatedAt` field
- V1 migration created `comments` table without `updated_at` column
- V3 migration added `updated_at` to `audit_logs` but not `comments`
- Hibernate validation fails: "Schema-validation: missing column [updated_at] in table [comments]"

**Solution:**
- Created `V4__add_updated_at_to_comments.sql` migration
- Adds `updated_at TIMESTAMP WITH TIME ZONE` column with default
- Backfills existing rows with `created_at` value
- Column is nullable (matches BaseEntity definition)

**Files Changed:**
- `backend/src/main/resources/db/migration/V4__add_updated_at_to_comments.sql` (NEW)

### B) Docker Frontend Port Conflict

**Problem:**
- Frontend container tried to bind to port 3000 (already used by local dev server)
- Vite env vars baked at build-time, not runtime

**Solution:**
- Changed frontend port mapping to `3001:80` (configurable via `FRONTEND_PORT` env var)
- Updated frontend Dockerfile to accept `VITE_API_URL` as build arg
- Updated docker-compose to pass build args correctly

**Files Changed:**
- `docker-compose.yml` - Frontend port changed to `3001:80`, added build args
- `frontend/Dockerfile` - Added ARG/ENV for VITE_API_URL

### C) Docker Compose Robustness

**Improvements:**
1. Removed obsolete `version: '3.8'` (not needed in Compose v2+)
2. Added MySQL healthcheck using `mysqladmin ping`
3. Added backend healthcheck using `/actuator/health` endpoint
4. Changed `depends_on` to use `condition: service_healthy` instead of just container start
5. Made frontend port configurable via `FRONTEND_PORT` env var (defaults to 3001)
6. Added curl to backend image for healthcheck

**Files Changed:**
- `docker-compose.yml` - Complete rewrite with healthchecks and proper dependencies
- `backend/Dockerfile` - Added `curl` for healthcheck support

## Files Modified Summary

1. **backend/src/main/resources/db/migration/V4__add_updated_at_to_comments.sql** (NEW)
   - Adds missing `updated_at` column to comments table

2. **docker-compose.yml**
   - Removed `version: '3.8'`
   - Added MySQL healthcheck
   - Added backend healthcheck
   - Changed `depends_on` to use health conditions
   - Frontend port: `3001:80` (configurable)
   - Frontend build args for VITE_API_URL

3. **frontend/Dockerfile**
   - Added ARG/ENV for VITE_API_URL build-time variable

4. **backend/Dockerfile**
   - Added `curl` package for healthcheck support

## Verification Steps

### 1. Clean Up and Rebuild

```bash
# Stop and remove all containers, networks, and volumes
docker compose down -v

# Rebuild and start all services
docker compose up -d --build
```

### 2. Verify All Containers Are Running

```bash
docker ps
```

**Expected Output:**
```
CONTAINER ID   IMAGE                    STATUS          PORTS                    NAMES
<id>           multi_tenant_saas...    Up X seconds    0.0.0.0:8080->8080/tcp   mt_backend
<id>           multi_tenant_saas...    Up X seconds    0.0.0.0:3001->80/tcp     mt_frontend
<id>           mysql:8.0               Up X seconds    0.0.0.0:3306->3306/tcp   mt_mysql
```

All three containers should show "Up" status.

### 3. Check Backend Logs for Successful Startup

```bash
docker compose logs -f backend
```

**Expected Output:**
- Should see "Started SaasBackendApplication" message
- Should see Flyway migration: "Migrating schema to version 4"
- Should see "Successfully validated X migrations"
- **NO** schema validation errors about missing `updated_at` column
- **NO** Hibernate errors

**Key Success Indicators:**
```
Flyway: Migrating schema "public" to version "4 - add updated at to comments"
...
Started SaasBackendApplication in X.XXX seconds
```

### 4. Test Backend Health Endpoint

```bash
curl http://localhost:8080/actuator/health
```

**Expected Output:**
```json
{"status":"UP"}
```

**Alternative (PowerShell):**
```powershell
Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" | Select-Object -ExpandProperty Content
```

### 5. Test Backend API (Tenant Registration Endpoint)

```bash
curl -X POST http://localhost:8080/api/tenants \
  -H "Content-Type: application/json" \
  -d '{"tenantName":"Test Org","tenantSlug":"test-org","adminName":"Admin","adminEmail":"admin@test.org","adminPassword":"Test@123"}'
```

**Expected Output:**
- Status: 200 OK
- JSON response with tenant details

**If Conflict (409):**
- Tenant slug already exists - this is expected if you've registered before
- Try with a different slug

### 6. Verify Frontend is Accessible

Open browser: http://localhost:3001

**Expected:**
- Frontend loads without errors
- Can navigate to signup/login pages
- API calls to backend work (check browser console for network requests)

### 7. Verify Database Schema

```bash
# Connect to MySQL
docker exec -it mt_mysql mysql -u saas_user -pSaas@123 multitenant_saas

# Check comments table structure
DESCRIBE comments;
```

**Expected Output:**
```
Column     | Type                        | Nullable
-----------+-----------------------------+----------
id         | uuid                        | not null
tenant_id  | uuid                        | not null
ticket_id  | uuid                        | not null
message    | text                        | not null
author_id  | uuid                        | 
created_at | timestamp with time zone    | 
updated_at | timestamp with time zone    |  <-- This should exist now
```

### 8. Check Flyway Migration Status

```bash
docker exec -it mt_backend java -jar app.jar --spring.flyway.info
```

Or check logs for:
```
Flyway: Current version of schema "public": 4
```

## Troubleshooting

### Backend Still Shows Schema Errors

1. Check if migration V4 ran:
   ```bash
   docker compose logs backend | grep "Migrating schema"
   ```

2. If migration didn't run, check Flyway baseline:
   ```bash
   docker compose exec backend sh
   # Inside container, check Flyway schema history
   ```

3. Manual migration (if needed):
   ```bash
   docker exec -it mt_mysql mysql -u saas_user -pSaas@123 multitenant_saas
   # Then run the SQL from V4 migration manually
   ```

### Frontend Can't Connect to Backend

1. Check backend is running:
   ```bash
   docker compose ps backend
   ```

2. Check backend logs for errors:
   ```bash
   docker compose logs backend
   ```

3. Verify CORS is configured (should allow localhost:3001)

### Port Conflicts

If port 3001 is also in use:
```bash
FRONTEND_PORT=3002 docker compose up -d frontend
```

Or change in docker-compose.yml:
```yaml
ports:
  - "3002:80"  # Change 3001 to any available port
```

## Success Criteria

✅ All three containers running (`docker ps` shows all UP)
✅ Backend logs show "Started SaasBackendApplication" without errors
✅ Backend health endpoint returns `{"status":"UP"}`
✅ Frontend accessible at http://localhost:3001
✅ Database has `updated_at` column in `comments` table
✅ Flyway reports schema version 4
✅ No Hibernate schema validation errors

## Next Steps

After verification:
1. Test tenant registration via frontend
2. Test login functionality
3. Test ticket creation and management
4. Monitor logs for any runtime issues

