# ==============================================================================
# ESP32 UHF RFID Scanner Smart Flashing Script
# ==============================================================================

$Port = "COM11"
$Baud = 460800
$BuildDir = "firmware/rfid-scanner/build"
$Esptool = "C:\Users\Ramil\AppData\Local\Arduino15\packages\esp32\tools\esptool_py\5.3.1\esptool.exe"

if (!(Test-Path $Esptool)) {
    $Esptool = "esptool.exe"
}

$MergedBin = "$BuildDir/rfid-scanner.ino.merged.bin"

if (!(Test-Path $MergedBin)) {
    Write-Host "==> Compiling firmware..." -ForegroundColor Cyan
    arduino-cli compile --fqbn esp32:esp32:esp32 --build-path $BuildDir firmware/rfid-scanner
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Compilation failed! Aborting." -ForegroundColor Red
        exit 1
    }
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  ESP32 UHF RFID Scanner Flasher - Port: $Port" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# Step A: Check if device is ALREADY in download mode (e.g. plugged in with BOOT held)
Write-Host "Checking if ESP32 is already in download mode (no-reset)..." -ForegroundColor Yellow
& $Esptool --chip esp32 --port $Port --baud $Baud --before no-reset chip-id 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "==> ESP32 is in download mode! Flashing now..." -ForegroundColor Green
    & $Esptool --chip esp32 --port $Port --baud $Baud --before no-reset --after hard-reset write-flash -z --flash-mode dio --flash-freq 80m --flash-size 4MB 0x0 $MergedBin
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nSUCCESS! Firmware flashed successfully!" -ForegroundColor Green
        exit 0
    }
}

# Step B: Auto-retry with standard reset while prompting the user
Write-Host "`nDevice is in normal mode. Attempting connection with reset..." -ForegroundColor Cyan
Write-Host "TIP: Press and HOLD the physical 'BOOT' button on the board now!" -ForegroundColor Yellow

$success = $false
for ($attempt = 1; $attempt -le 5; $attempt++) {
    Write-Host "`n[Attempt $attempt/5] Connecting to $Port... (HOLD BOOT BUTTON)" -ForegroundColor Cyan
    & $Esptool --chip esp32 --port $Port --baud $Baud --before default-reset --after hard-reset write-flash -z --flash-mode dio --flash-freq 80m --flash-size 4MB 0x0 $MergedBin
    if ($LASTEXITCODE -eq 0) {
        $success = $true
        break
    }
    Start-Sleep -Seconds 2
}

if ($success) {
    Write-Host "`n=================================================================" -ForegroundColor Green
    Write-Host " SUCCESS! Firmware flashed successfully to the ESP32!           " -ForegroundColor Green
    Write-Host "=================================================================" -ForegroundColor Green
} else {
    Write-Host "`n=================================================================" -ForegroundColor Red
    Write-Host " UNPLUG / RE-PLUG INSTRUCTION (100% Reliable):                   " -ForegroundColor Red
    Write-Host " 1. Unplug the ESP32 USB cable from your laptop.                " -ForegroundColor Yellow
    Write-Host " 2. Press and HOLD the 'BOOT' button on the ESP32 board.        " -ForegroundColor Yellow
    Write-Host " 3. While still holding 'BOOT', plug the USB cable back in.     " -ForegroundColor Yellow
    Write-Host " 4. Release the 'BOOT' button.                                  " -ForegroundColor Yellow
    Write-Host " 5. Run this script again: .\\flash_firmware.ps1                 " -ForegroundColor Green
    Write-Host "=================================================================" -ForegroundColor Red
}

