# Mobile Access Verification Script
# Run this script to verify your setup is ready for mobile access

Write-Host "=== Mobile/LAN Access Verification ===" -ForegroundColor Cyan
Write-Host ""

# Get PC IP address
Write-Host "1. Finding your PC's IP address..." -ForegroundColor Yellow
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" } | Select-Object -First 1).IPAddress
if ($ipAddress) {
    Write-Host "   Your LAN IP: $ipAddress" -ForegroundColor Green
} else {
    Write-Host "   Could not detect LAN IP. Please find it manually with: ipconfig" -ForegroundColor Red
    $ipAddress = Read-Host "   Enter your PC's IP address manually"
}

Write-Host ""

# Check if backend is listening
Write-Host "2. Checking if backend is listening on port 8080..." -ForegroundColor Yellow
$backendListening = netstat -ano | Select-String ":8080.*LISTENING"
if ($backendListening) {
    Write-Host "   ✓ Backend is listening on port 8080" -ForegroundColor Green
    $listeningOnAll = $backendListening | Select-String "0.0.0.0:8080"
    if ($listeningOnAll) {
        Write-Host "   ✓ Backend is bound to all interfaces (0.0.0.0)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ Backend may only be listening on localhost" -ForegroundColor Yellow
        Write-Host "   Check application.yml has: server.address: 0.0.0.0" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✗ Backend is NOT listening on port 8080" -ForegroundColor Red
    Write-Host "   Start backend with: cd backend && ./mvnw.cmd spring-boot:run" -ForegroundColor Yellow
}

Write-Host ""

# Check firewall rules
Write-Host "3. Checking Windows Firewall rules..." -ForegroundColor Yellow
$firewall8080 = netsh advfirewall firewall show rule name="Spring Boot 8080" 2>$null
$firewall3000 = netsh advfirewall firewall show rule name="Vite Dev Server 3000" 2>$null

if ($firewall8080 -match "Enabled.*Yes") {
    Write-Host "   ✓ Firewall rule for port 8080 exists and is enabled" -ForegroundColor Green
} else {
    Write-Host "   ✗ Firewall rule for port 8080 is missing or disabled" -ForegroundColor Red
    Write-Host "   Run as Administrator:" -ForegroundColor Yellow
    Write-Host "   netsh advfirewall firewall add rule name=`"Spring Boot 8080`" dir=in action=allow protocol=TCP localport=8080" -ForegroundColor Yellow
}

if ($firewall3000 -match "Enabled.*Yes") {
    Write-Host "   ✓ Firewall rule for port 3000 exists and is enabled" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Firewall rule for port 3000 is missing" -ForegroundColor Yellow
    Write-Host "   Run as Administrator:" -ForegroundColor Yellow
    Write-Host "   netsh advfirewall firewall add rule name=`"Vite Dev Server 3000`" dir=in action=allow protocol=TCP localport=3000" -ForegroundColor Yellow
}

Write-Host ""

# Test backend accessibility
Write-Host "4. Testing backend accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "   ✓ Backend accessible via localhost" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Backend NOT accessible via localhost" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

if ($ipAddress) {
    try {
        $response = Invoke-WebRequest -Uri "http://${ipAddress}:8080/actuator/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        Write-Host "   ✓ Backend accessible via LAN IP ($ipAddress)" -ForegroundColor Green
    } catch {
        Write-Host "   ✗ Backend NOT accessible via LAN IP ($ipAddress)" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   Check firewall rules and ensure backend is bound to 0.0.0.0" -ForegroundColor Yellow
    }
}

Write-Host ""

# Summary
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "To access from mobile device:" -ForegroundColor Yellow
Write-Host "  Frontend: http://${ipAddress}:3000" -ForegroundColor White
Write-Host "  Backend:  http://${ipAddress}:8080" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Ensure backend is running: cd backend && ./mvnw.cmd spring-boot:run" -ForegroundColor White
Write-Host "  2. Ensure frontend is running: cd frontend && npm run dev" -ForegroundColor White
Write-Host "  3. On mobile (same Wi-Fi), open: http://${ipAddress}:3000" -ForegroundColor White
Write-Host "  4. Check browser console - API calls should go to ${ipAddress}:8080" -ForegroundColor White
Write-Host ""

