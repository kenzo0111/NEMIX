# ==============================================================================
# ESP32 UHF RFID Scanner Smart Flashing Script
# ==============================================================================

[CmdletBinding()]
param(
    [string]$Port,
    [ValidateRange(9600, 921600)]
    [int]$Baud = 115200,
    [switch]$ManualBoot,
    [switch]$DiagnoseOnly,
    [switch]$NoStub
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

# A readable MAC does not establish that the SPI flash is working.
# Check at 115200 baud; $Baud controls the later upload speed.
$ResetMode = if ($ManualBoot) { 'no-reset' } else { 'default-reset' }
$StubOptions = @()
if ($NoStub) { $StubOptions = @('--no-stub') }

function Confirm-Flash {
    param([string]$Before)
    Write-Host "==> Checking flash memory on $Port. Close any serial monitor first." -ForegroundColor Cyan
    $FlashOutput = @(& $Esptool --chip esp32 --port $Port --baud 115200 --before $Before --after no-reset @StubOptions flash-id |
        ForEach-Object { Write-Host $_; $_ })
    $FlashExitCode = $LASTEXITCODE
    $FlashText = $FlashOutput -join "`n"
    if ($FlashExitCode -ne 0) {
        Write-Host 'Connection/check failed. No firmware was written by this run.' -ForegroundColor Red
        Write-Host 'Close serial monitors and check the USB cable and port.'
        Write-Host 'Hold BOOT, tap EN/RESET, release BOOT, then retry with -ManualBoot.'
        exit 1
    }
    if ($FlashText -match '(?i)Failed to communicate with the flash chip|Manufacturer:\s*(?:0x)?(?:ff|00)\b|Device:\s*(?:0x)?(?:ffff|0000|00)\b|Detected flash size:\s*Unknown' -or
        $FlashText -notmatch '(?im)^\s*Manufacturer:\s*(?:0x)?[0-9a-f]+\s*$' -or
        $FlashText -notmatch '(?im)^\s*Device:\s*(?:0x)?[0-9a-f]+\s*$') {
        Write-Host 'STOP: Flash memory did not return a valid ID. No firmware was written by this run.' -ForegroundColor Red
        Write-Host 'Power off and disconnect external wiring/battery; test the ESP32 on USB alone.'
        Write-Host 'Try a different USB data cable/port. Persistent failure needs board/power inspection.'
        Write-Host 'Do not erase flash to fix this error. Tap EN/RESET to leave download mode.'
        exit 1
    }
    Write-Host 'Flash ID check passed.' -ForegroundColor Green
}

Confirm-Flash -Before $ResetMode
if ($DiagnoseOnly) {
    Write-Host 'Flash detection passed; no firmware written. Tap EN/RESET to boot normally.' -ForegroundColor Green
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

# Recheck after compilation in case USB or flash communication was lost.
Confirm-Flash -Before 'no-reset'
# Selective writes preserve NVS; never use erase-all or the merged image.
Write-Host "==> Uploading at $Baud baud. Release BOOT before upload completes." -ForegroundColor Cyan
& $Esptool --chip esp32 --port $Port --baud $Baud --before no-reset --after hard-reset @StubOptions write-flash -z --flash-mode dio --flash-freq 80m --flash-size 4MB @FirmwareImages
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Upload failed; the firmware may be partially written. See the error above.' -ForegroundColor Red
    Write-Host 'No automatic write retries were performed. Resolve the connection/flash fault first.'
    exit 1
}
Write-Host "`nSUCCESS! Firmware flashed successfully to the ESP32!" -ForegroundColor Green
