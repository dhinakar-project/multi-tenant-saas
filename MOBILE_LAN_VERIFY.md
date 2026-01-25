# Mobile/LAN Access Verification Guide

## Quick Start

### 1. Start Backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

**Expected:** Backend starts on `http://localhost:8080` (also accessible via LAN IP)

### 2. Start Frontend

```powershell
cd frontend
npm run dev -- --host
```

**Note:** The `--host` flag makes Vite listen on all interfaces (0.0.0.0), allowing LAN access.

**Expected:** Frontend starts on `http://localhost:3000` (also accessible via LAN IP)

### 3. Find Your PC's IP Address

```powershell
ipconfig | findstr IPv4
```

Look for your Wi-Fi adapter IP (usually `192.168.x.x` or `10.x.x.x`).

## Verification Tests

### Test 1: CORS Preflight (OPTIONS)

**PowerShell Command:**
```powershell
curl.exe -i -X OPTIONS "http://192.168.0.104:8080/api/tenants" `
  -H "Origin: http://192.168.0.104:3000" `
  -H "Access-Control-Request-Method: POST" `
  -H "Access-Control-Request-Headers: content-type"
```

**Expected Output:**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://192.168.0.104:3000
Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
Access-Control-Allow-Headers: Authorization,Content-Type,X-Tenant-Slug
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 1800
Content-Length: 0
```

**Key Success Indicators:**
- ✅ Status: `200 OK` (NOT 403 Forbidden)
- ✅ `Access-Control-Allow-Origin` header present
- ✅ `Access-Control-Allow-Methods` includes POST
- ✅ `Access-Control-Allow-Headers` includes required headers

**Important:** Use `curl.exe` (not `curl` alias) in PowerShell.

### Test 2: Tenant Registration (POST)

**PowerShell Command:**
```powershell
curl.exe -i -X POST "http://192.168.0.104:8080/api/tenants" `
  -H "Origin: http://192.168.0.104:3000" `
  -H "Content-Type: application/json" `
  -d "{\"tenantName\":\"Test Company\",\"tenantSlug\":\"test-company-2026\",\"adminName\":\"Admin User\",\"adminEmail\":\"admin@test.com\",\"adminPassword\":\"Test@123\"}"
```

**Expected Output (Success - 200):**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://192.168.0.104:3000
Access-Control-Allow-Credentials: true
Content-Type: application/json

{"id":"<uuid>","slug":"test-company-2026","name":"Test Company"}
```

**Expected Output (Conflict - 409):**
```
HTTP/1.1 409 Conflict
Access-Control-Allow-Origin: http://192.168.0.104:3000
Access-Control-Allow-Credentials: true
Content-Type: application/json

{"timestamp":"...","status":409,"error":"Conflict","message":"Tenant slug 'test-company-2026' already exists"}
```

**Key Success Indicators:**
- ✅ Status: `200`, `201`, or `409` (NOT 401/403)
- ✅ `Access-Control-Allow-Origin` header present
- ✅ JSON response body (not CORS error)

### Test 3: Test from Mobile Browser

1. **Ensure both backend and frontend are running**
2. **Find your PC's IP** (e.g., `192.168.0.104`)
3. **On mobile device** (same Wi-Fi network), open:
   ```
   http://192.168.0.104:3000
   ```
4. **Navigate to signup page:**
   ```
   http://192.168.0.104:3000/signup
   ```
5. **Fill registration form and submit**

**Expected:**
- ✅ Frontend loads without errors
- ✅ Registration form submits successfully
- ✅ No CORS errors in browser console
- ✅ Network tab shows:
   - OPTIONS preflight → 200 OK
   - POST request → 200/201/409
   - Both requests include CORS headers

### Test 4: Verify Backend Accessibility

**From PC:**
```powershell
# Should work
curl.exe http://localhost:8080/actuator/health

# Should also work with LAN IP
curl.exe http://192.168.0.104:8080/actuator/health
```

**From Mobile Browser:**
```
http://192.168.0.104:8080/actuator/health
```

**Expected:** JSON response `{"status":"UP"}`

## Troubleshooting

### Issue: CORS Preflight Returns 403

**Check:**
1. Backend is restarted after SecurityConfig changes
2. TenantFilter properly skips OPTIONS requests
3. SecurityConfig permits OPTIONS: `.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()`

### Issue: Frontend Can't Access Backend from Mobile

**Check:**
1. Backend binds to `0.0.0.0` (check `application.yml`: `server.address: 0.0.0.0`)
2. Windows Firewall allows port 8080:
   ```powershell
   netsh advfirewall firewall show rule name="Spring Boot 8080"
   ```
3. Frontend uses correct API URL (check browser console Network tab)

### Issue: Vite Not Accessible from Mobile

**Check:**
1. Vite started with `--host` flag: `npm run dev -- --host`
2. Vite config has `host: true` in `vite.config.js`
3. Windows Firewall allows port 3000:
   ```powershell
   netsh advfirewall firewall show rule name="Vite Dev Server 3000"
   ```

### Issue: PowerShell `curl` Alias Issues

**Solution:** Always use `curl.exe` instead of `curl`:
```powershell
# Wrong (uses Invoke-WebRequest alias)
curl http://localhost:8080

# Correct
curl.exe http://localhost:8080
```

## Configuration Summary

### Backend CORS
- **Allowed Origins:** `localhost:*`, `127.0.0.1:*`, `192.168.*.*:*`, `10.*.*.*:*`, `172.*.*.*:*`
- **Allowed Methods:** GET, POST, PUT, PATCH, DELETE, OPTIONS
- **Allowed Headers:** Authorization, Content-Type, X-Tenant-Slug
- **Credentials:** Enabled

### Frontend API URL
- **Priority 1:** `VITE_API_URL` environment variable
- **Priority 2:** Dynamic detection based on `window.location.hostname`
  - `localhost`/`127.0.0.1` → `http://localhost:8080/api`
  - LAN IP → `http://{hostname}:8080/api`

### Network Binding
- **Backend:** Binds to `0.0.0.0:8080` (all interfaces)
- **Frontend (Vite):** Binds to `0.0.0.0:3000` when using `--host` flag

## Production Notes

For production deployment:
- Restrict CORS to specific domains instead of wildcards
- Use HTTPS
- Set `VITE_API_URL` at build time for Docker deployments
- Consider environment-specific configurations

