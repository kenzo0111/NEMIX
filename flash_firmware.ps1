# ==============================================================================
# ESP32 UHF RFID Scanner Firmware Flashing Script
# ==============================================================================
# Instructions:
# 1. Ensure the ESP32 is plugged into USB (COM11).
# 2. When esptool shows 'Connecting........', press and HOLD the physical BOOT
#    button on the ESP32 board until the flashing progress bar begins.
# ==============================================================================

$Port = "COM11"
$Fqbn = "esp32:esp32:esp32"
$Sketch = "firmware/rfid-scanner"

Write-Host "==> [1/2] Compiling firmware..." -ForegroundColor Cyan
arduino-cli compile --fqbn $Fqbn $Sketch
if ($LASTEXITCODE -ne 0) {
    Write-Host "Compilation failed! Aborting." -ForegroundColor Red
    exit 1
}

Write-Host "==> [2/2] Uploading firmware to $Port..." -ForegroundColor Cyan
Write-Host ">> IMPORTANT: If connection hangs at 'Connecting........', PRESS AND HOLD the 'BOOT' button on your ESP32 board! <<" -ForegroundColor Yellow

arduino-cli upload -p $Port --fqbn $Fqbn $Sketch
if ($LASTEXITCODE -eq 0) {
    Write-Host "==> Firmware flashed successfully!" -ForegroundColor Green
} else {
    Write-Host "==> Upload failed. Remember to hold down the BOOT button while connecting." -ForegroundColor Red
}
