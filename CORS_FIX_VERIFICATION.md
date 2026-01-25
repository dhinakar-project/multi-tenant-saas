# CORS Fix Verification Guide

## Changes Made

### 1. TenantFilter.java
**File:** `backend/src/main/java/com/example/saas/security/TenantFilter.java`

**Changes:**
- Added `shouldNotFilter()` method to skip:
  - All OPTIONS requests (CORS preflight)
  - POST /api/tenants (public registration endpoint)
  - /api/auth/** (auth endpoints)
  - Infrastructure paths (actuator, swagger, etc.)
- This ensures TenantFilter doesn't block CORS preflight requests

### 2. SecurityConfig.java
**File:** `backend/src/main/java/com/example/saas/config/SecurityConfig.java`

**Status:** Already correct - no changes needed
- ✅ Uses `allowedOriginPatterns` for LAN IPs
- ✅ Permits OPTIONS requests
- ✅ Permits POST /api/tenants
- ✅ CORS properly configured

### 3. JwtAuthenticationFilter.java
**File:** `backend/src/main/java/com/example/saas/security/JwtAuthenticationFilter.java`

**Status:** Already correct - no changes needed
- ✅ Skips if no Authorization header (OPTIONS won't have one)
- ✅ Doesn't block preflight requests

## Verification Commands

### Prerequisites
1. Backend must be running on `http://192.168.0.104:8080`
2. Replace `192.168.0.104` with your actual PC IP if different

### Test 1: OPTIONS Preflight Request

**Command (PowerShell):**
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
Access-Control-Allow-Headers: *
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 1800
Content-Length: 0
```

**Key Success Indicators:**
- ✅ Status: `200 OK` (NOT 403 Forbidden)
- ✅ `Access-Control-Allow-Origin` header present
- ✅ `Access-Control-Allow-Methods` includes POST
- ✅ `Access-Control-Allow-Headers` present

### Test 2: POST Tenant Registration

**Command (PowerShell):**
```powershell
curl.exe -i -X POST "http://192.168.0.104:8080/api/tenants" `
  -H "Origin: http://192.168.0.104:3000" `
  -H "Content-Type: application/json" `
  -d "{\"tenantName\":\"dhina_company\",\"tenantSlug\":\"dhina-2026\",\"adminName\":\"Dhinakar R\",\"adminEmail\":\"dhinakar79044@gmail.com\",\"adminPassword\":\"D1h2i3n4\"}"
```

**Expected Output (Success - 200/201):**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://192.168.0.104:3000
Access-Control-Allow-Credentials: true
Content-Type: application/json
Content-Length: <length>

{"id":"<uuid>","slug":"dhina-2026","name":"dhina_company"}
```

**Expected Output (Conflict - 409):**
```
HTTP/1.1 409 Conflict
Access-Control-Allow-Origin: http://192.168.0.104:3000
Access-Control-Allow-Credentials: true
Content-Type: application/json

{"timestamp":"...","status":409,"error":"Conflict","message":"Tenant slug 'dhina-2026' already exists"}
```

**Key Success Indicators:**
- ✅ Status: `200`, `201`, or `409` (NOT 401/403)
- ✅ `Access-Control-Allow-Origin` header present
- ✅ JSON response body (not CORS error)
- ✅ No "CORS blocked" errors

### Test 3: OPTIONS from localhost (PC Browser)

**Command (PowerShell):**
```powershell
curl.exe -i -X OPTIONS "http://localhost:8080/api/tenants" `
  -H "Origin: http://localhost:3000" `
  -H "Access-Control-Request-Method: POST" `
  -H "Access-Control-Request-Headers: content-type"
```

**Expected:** Same as Test 1, but with `Access-Control-Allow-Origin: http://localhost:3000`

### Test 4: Verify from Mobile Browser

1. **Open mobile browser** (same Wi-Fi network)
2. **Navigate to:** `http://192.168.0.104:3000/signup`
3. **Open browser DevTools** (if available) or check Network tab
4. **Fill registration form and submit**

**Expected:**
- ✅ OPTIONS preflight succeeds (200 OK)
- ✅ POST request succeeds (200/201 or 409)
- ✅ No CORS errors in console
- ✅ Network tab shows both OPTIONS and POST requests
- ✅ Response headers include `Access-Control-Allow-Origin`

## Troubleshooting

### Issue: Still Getting 403 on OPTIONS

**Check:**
1. Backend is restarted after changes
2. TenantFilter changes are compiled
3. No other filters are blocking OPTIONS

**Debug:**
```powershell
# Check if backend is running
netstat -ano | findstr :8080

# Check backend logs for filter chain
# Look for TenantFilter execution on OPTIONS requests
```

### Issue: CORS Headers Missing

**Check:**
1. SecurityConfig.corsConfigurationSource() is being used
2. `.cors(cors -> cors.configurationSource(corsConfigurationSource()))` is in SecurityFilterChain
3. Origin matches one of the allowed patterns

**Verify CORS config:**
```powershell
# Test with verbose output
curl.exe -v -X OPTIONS "http://192.168.0.104:8080/api/tenants" `
  -H "Origin: http://192.168.0.104:3000" `
  -H "Access-Control-Request-Method: POST"
```

### Issue: POST Still Returns 401/403

**Check:**
1. SecurityConfig permits POST /api/tenants:
   ```java
   .requestMatchers(HttpMethod.POST, "/api/tenants").permitAll()
   ```
2. TenantFilter skips POST /api/tenants:
   ```java
   if (path.startsWith("/api/tenants") && "POST".equalsIgnoreCase(method)) {
       return true;
   }
   ```

## How It Works

### Before Fix
1. Browser sends OPTIONS preflight → TenantFilter runs → Blocks request → 403 → No CORS headers
2. Browser blocks POST due to failed preflight

### After Fix
1. Browser sends OPTIONS preflight → TenantFilter.skip() → CORS filter adds headers → 200 OK
2. Browser sends POST → TenantFilter.skip() → Security permits → Controller handles → 200/201/409 with CORS headers

### Filter Order
1. **CorsFilter** (Spring Security) - Adds CORS headers
2. **TenantFilter** - Skips OPTIONS/public endpoints
3. **JwtAuthenticationFilter** - Skips if no auth header
4. **SecurityFilterChain** - Authorizes based on rules

## Production Notes

- Current CORS patterns allow all LAN IPs (192.168.*, 10.*, 172.*)
- For production, restrict to specific domains:
  ```java
  configuration.setAllowedOriginPatterns(List.of(
      "https://yourdomain.com",
      "https://*.yourdomain.com"
  ));
  ```
- Consider using environment-specific CORS configs via profiles

