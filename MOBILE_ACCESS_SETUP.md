# Mobile/LAN Access Setup Guide

## Problem
When accessing the frontend from a mobile device on the same Wi-Fi network, `localhost` in API calls refers to the phone itself, not your PC. This causes `ERR_CONNECTION_REFUSED` errors.

## Solution
The project now uses **dynamic API URL detection**:
- PC accessing `http://localhost:3000` → Backend calls `http://localhost:8080/api`
- Mobile accessing `http://192.168.0.104:3000` → Backend calls `http://192.168.0.104:8080/api`

## Changes Made

### 1. Backend Binding (`backend/src/main/resources/application.yml`)
- Added `server.address: 0.0.0.0` to bind to all network interfaces
- Backend now accessible from LAN at `http://192.168.0.104:8080`

### 2. Frontend Dynamic API URL (`frontend/src/api/api.js`)
- Implemented automatic detection based on `window.location.hostname`
- No hardcoded IPs needed - works automatically

### 3. Vite Configuration (`frontend/vite.config.js`)
- Already configured with `host: true` (listens on all interfaces)
- Accessible from LAN at `http://192.168.0.104:3000`

## Windows Firewall Setup

Run these commands in **Administrator PowerShell**:

```powershell
# Allow Spring Boot backend (port 8080)
netsh advfirewall firewall add rule name="Spring Boot 8080" dir=in action=allow protocol=TCP localport=8080

# Allow Vite dev server (port 3000)
netsh advfirewall firewall add rule name="Vite Dev Server 3000" dir=in action=allow protocol=TCP localport=3000

# Allow Docker frontend (port 3001) - optional if using Docker
netsh advfirewall firewall add rule name="Docker Frontend 3001" dir=in action=allow protocol=TCP localport=3001
```

**Note:** If you get "rule already exists" errors, the rules are already set. You can verify with:
```powershell
netsh advfirewall firewall show rule name="Spring Boot 8080"
```

## Finding Your PC's IP Address

```powershell
# PowerShell
ipconfig | findstr IPv4

# Or get just the LAN IP
ipconfig | Select-String "IPv4" | Select-Object -First 1
```

Look for the IP under your Wi-Fi adapter (usually starts with 192.168.x.x or 10.x.x.x).

## Running the Application

### Option 1: Local Development (Recommended for Mobile Testing)

**Terminal 1 - Backend:**
```bash
cd backend
./mvnw.cmd spring-boot:run
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Option 2: Docker Compose

```bash
docker compose up -d --build
```

**Note:** For Docker, frontend API URL is baked at build time. To use dynamic detection with Docker, you'd need to rebuild with a different approach or use the local dev server.

## Verification Steps

### 1. Verify Backend is Listening on All Interfaces

**On PC:**
```powershell
netstat -ano | findstr :8080
```

**Expected Output:**
```
TCP    0.0.0.0:8080           0.0.0.0:0              LISTENING       <PID>
TCP    [::]:8080              [::]:0                 LISTENING       <PID>
```

The `0.0.0.0` means it's listening on all interfaces (not just localhost).

### 2. Test Backend from PC

```powershell
# Should work
curl http://localhost:8080/actuator/health
# Expected: {"status":"UP"}

# Should also work with LAN IP
curl http://192.168.0.104:8080/actuator/health
# Expected: {"status":"UP"}
```

### 3. Test Backend from Mobile Device

On your phone's browser (same Wi-Fi network):
```
http://192.168.0.104:8080/actuator/health
```

**Expected:** JSON response `{"status":"UP"}`

If you get connection refused, check:
- Windows Firewall rules are added (see above)
- Backend is actually running
- Phone is on same Wi-Fi network
- IP address is correct

### 4. Test Frontend from Mobile Device

On your phone's browser:
```
http://192.168.0.104:3000
```

**Expected:**
- Frontend loads
- Open browser DevTools (if possible) or check Network tab
- API calls should go to `http://192.168.0.104:8080/api` (not localhost)
- No `ERR_CONNECTION_REFUSED` errors

### 5. Test Tenant Registration from Mobile

1. Open `http://192.168.0.104:3000/signup` on mobile
2. Fill out the registration form
3. Submit

**Expected:**
- Registration succeeds
- No connection errors in browser console
- Network tab shows POST to `http://192.168.0.104:8080/api/tenants`

## Troubleshooting

### Backend Not Accessible from Mobile

1. **Check firewall:**
   ```powershell
   netsh advfirewall firewall show rule name="Spring Boot 8080"
   ```

2. **Verify backend is listening on 0.0.0.0:**
   ```powershell
   netstat -ano | findstr :8080
   ```
   Should show `0.0.0.0:8080`, not `127.0.0.1:8080`

3. **Check backend logs** for binding confirmation:
   ```
   Netty started on port 8080
   ```

### Frontend Still Calls localhost from Mobile

1. **Clear browser cache** on mobile
2. **Hard refresh** the page
3. **Check browser console** - should show API calls to `192.168.0.104:8080`
4. **Verify `api.js`** has the dynamic detection code

### Vite Dev Server Not Accessible from Mobile

1. **Check `vite.config.js`** has `host: true`
2. **Restart Vite** after config changes:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```
3. **Check firewall** rule for port 3000

## How It Works

### Why localhost Fails on Mobile
- `localhost` always refers to the device making the request
- On PC: `localhost` = your PC
- On mobile: `localhost` = the phone itself
- Mobile can't reach your PC via `localhost`

### Why Dynamic Detection Works
- Frontend detects the hostname used to access it
- If accessed via `192.168.0.104:3000`, it uses `192.168.0.104:8080` for API
- If accessed via `localhost:3000`, it uses `localhost:8080` for API
- Works automatically without hardcoding IPs

### Backend Binding to 0.0.0.0
- `0.0.0.0` means "listen on all network interfaces"
- Allows connections from:
  - `localhost` (127.0.0.1)
  - LAN IP (192.168.0.104)
  - Any other network interface
- Without this, Spring Boot defaults to localhost-only in some configurations

## Production Considerations

For production deployment:
- Use proper domain names instead of IPs
- Configure CORS properly for your domain
- Use HTTPS
- Consider environment-specific API URLs via env vars

