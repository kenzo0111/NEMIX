# ==============================================================================
# ESP32 UHF RFID Scanner Smart Flashing Script
# ==============================================================================

[CmdletBinding()]
param(
    [string]$Port,
    [ValidateRange(9600, 921600)]
    [int]$Baud = 115200,
    [switch]$ManualBoot,
    [switch]$DiagnoseOnly
)

$ErrorActionPreference = 'Stop'
$Ports = @([System.IO.Ports.SerialPort]::GetPortNames())
if (!$Port) {
    if ($Ports.Count -ne 1) {
        Write-Host "Specify -Port COMx. Available ports: $($Ports -join ', ')." -ForegroundColor Red
        exit 1
    }
    $Port = $Ports[0]
}
if ($Port -notin $Ports) {
    Write-Host "$Port is not connected. Available ports: $($Ports -join ', ')." -ForegroundColor Red
    exit 1
}
$BuildDir = Join-Path $PSScriptRoot 'firmware/rfid-scanner/build'
$SketchDir = Join-Path $PSScriptRoot 'firmware/rfid-scanner'
$ToolRoot = Join-Path $env:LOCALAPPDATA 'Arduino15/packages/esp32/tools/esptool_py'
$Esptool = Get-ChildItem -LiteralPath $ToolRoot -Directory -ErrorAction SilentlyContinue |
    Sort-Object { [version]$_.Name } -Descending |
    ForEach-Object { Join-Path $_.FullName 'esptool.exe' } |
    Where-Object { Test-Path -LiteralPath $_ } |
    Select-Object -First 1

if (!$Esptool) {
    $Esptool = "esptool.exe"
}

$BootloaderBin = "$BuildDir/rfid-scanner.ino.bootloader.bin"
$PartitionsBin = "$BuildDir/rfid-scanner.ino.partitions.bin"
$BootAppBin = "$BuildDir/boot_app0.bin"
$ApplicationBin = "$BuildDir/rfid-scanner.ino.bin"

# Check communication before a lengthy build. Keep an existing manual boot mode.
Write-Host "==> Checking ESP32 on $Port. Close any serial monitor first." -ForegroundColor Cyan
& $Esptool --chip esp32 --port $Port --baud $Baud --before no-reset --after no-reset chip-id
$Connected = $LASTEXITCODE -eq 0
if (!$Connected -and !$ManualBoot) {
    & $Esptool --chip esp32 --port $Port --baud $Baud --before default-reset --after no-reset chip-id
    $Connected = $LASTEXITCODE -eq 0
}
if (!$Connected) {
    Write-Host 'No firmware was written. See the connection error above.' -ForegroundColor Red
    Write-Host 'Access denied: close other programs using the COM port.'
    Write-Host 'No serial data: hold BOOT, tap EN/RESET, then release BOOT.'
    Write-Host "Retry: .\flash_firmware.ps1 -Port $Port -ManualBoot"
    Write-Host 'If it still fails, try a known USB data cable and a direct USB port.'
    Write-Host 'Power off before disconnecting the external RFID module; retry with the ESP32 alone.'
    exit 1
}
if ($DiagnoseOnly) {
    Write-Host 'Bootloader connection confirmed; no firmware written. Tap EN/RESET to boot normally.' -ForegroundColor Green
    exit 0
}

# Always rebuild so an old binary can never be flashed after source changes.
Write-Host "==> Compiling current firmware sources..." -ForegroundColor Cyan
arduino-cli compile --fqbn esp32:esp32:esp32 --build-path $BuildDir $SketchDir
if ($LASTEXITCODE -ne 0) {
    Write-Host "Compilation failed! Aborting." -ForegroundColor Red
    exit 1
}

$FirmwareImages = @(
    "0x1000", $BootloaderBin,
    "0x8000", $PartitionsBin,
    "0xe000", $BootAppBin,
    "0x10000", $ApplicationBin
)
for ($ImageIndex = 1; $ImageIndex -lt $FirmwareImages.Count; $ImageIndex += 2) {
    if (!(Test-Path -LiteralPath $FirmwareImages[$ImageIndex])) {
        throw "Missing firmware image: $($FirmwareImages[$ImageIndex])"
    }
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  ESP32 UHF RFID Scanner Flasher - Port: $Port" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# Step A: Check if device is ALREADY in download mode (e.g. plugged in with BOOT held)
Write-Host "Checking if ESP32 is already in download mode (no-reset)..." -ForegroundColor Yellow
& $Esptool --chip esp32 --port $Port --baud $Baud --before no-reset --after no-reset chip-id
if ($LASTEXITCODE -eq 0) {
    Write-Host "==> ESP32 is in download mode! Flashing now..." -ForegroundColor Green
    # Do not flash the merged 4 MB image: it overwrites the NVS credentials/token.
    Write-Host 'Release BOOT before the upload finishes so the board can start normally.'
    & $Esptool --chip esp32 --port $Port --baud $Baud --before no-reset --after hard-reset write-flash -z --flash-mode dio --flash-freq 80m --flash-size 4MB @FirmwareImages
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nSUCCESS! Firmware flashed successfully!" -ForegroundColor Green
        exit 0
    }
}

# Step B: Auto-retry with standard reset while prompting the user
Write-Host "`nDevice is in normal mode. Attempting connection with reset..." -ForegroundColor Cyan
Write-Host "TIP: Press and HOLD the physical 'BOOT' button on the board now!" -ForegroundColor Yellow

$success = $false
for ($attempt = 1; $attempt -le 2; $attempt++) {
    Write-Host "`n[Attempt $attempt/2] Connecting to $Port at 115200 baud..." -ForegroundColor Cyan
    $ResetMode = if ($ManualBoot) { 'no-reset' } else { 'default-reset' }
    & $Esptool --chip esp32 --port $Port --baud 115200 --before $ResetMode --after hard-reset write-flash -z --flash-mode dio --flash-freq 80m --flash-size 4MB @FirmwareImages
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
    Write-Host " Upload failed. Check the esptool error above.                 " -ForegroundColor Red
    Write-Host " 1. Unplug the ESP32 USB cable from your laptop.                " -ForegroundColor Yellow
    Write-Host " 2. Press and HOLD the 'BOOT' button on the ESP32 board.        " -ForegroundColor Yellow
    Write-Host " 3. While still holding 'BOOT', plug the USB cable back in.     " -ForegroundColor Yellow
    Write-Host " 4. Release the 'BOOT' button.                                  " -ForegroundColor Yellow
    Write-Host " 5. Retry: .\flash_firmware.ps1 -Port $Port -ManualBoot" -ForegroundColor Green
    Write-Host "=================================================================" -ForegroundColor Red
    exit 1
}
