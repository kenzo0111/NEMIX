# ESP32 UHF RFID Scanner Firmware

## 1. Purpose of the Firmware Folder
This directory (`firmware/rfid-scanner/`) is dedicated to the firmware development of the handheld UHF RFID scanner powered by an **ESP32 WROOM-32** microcontroller and a **YRM100 UHF RFID reader** module.

This firmware codebase is completely decoupled from the Laravel backend application, web frontends, and database layer. It maintains its own build environment, libraries, header definitions, and test files:
- `rfid-scanner.ino`: Primary sketch entry point (`setup()` and `loop()`).
- `src/`: Modular C++ source files (drivers, Wi-Fi handlers, API clients).
- `include/`: C/C++ header files and pin definition contracts.
- `lib/`: Third-party and custom device libraries (YRM100 protocol parser, etc.).
- `config/`: Configuration templates (network settings, API endpoints, tokens).
- `tests/`: Firmware unit tests and hardware mock routines.

---

## 2. Arduino CLI Setup (Windows)

The firmware is designed to build and flash using the official **Arduino CLI**.

### Installation Options for Windows:
1. **Using Windows Package Manager (winget) [Recommended]**:
   ```powershell
   winget install ArduinoSA.CLI
   ```
   *Restart PowerShell after installation so PATH environment variables take effect.*

2. **Using Scoop**:
   ```powershell
   scoop install arduino-cli
   ```

3. **Manual Installation**:
   - Download the Windows 64-bit binary (`arduino-cli_..._Windows_64bit.zip`) from the [Arduino CLI GitHub Releases](https://github.com/arduino/arduino-cli/releases).
   - Extract `arduino-cli.exe` into a folder (e.g., `C:\Program Files\Arduino-CLI` or `C:\Users\<YourUser>\bin`).
   - Add that folder to your system `PATH`.

### Verify Installation:
```powershell
arduino-cli version
```

---

## 3. ESP32 Platform Setup

Once Arduino CLI is installed, configure it with the Espressif ESP32 Arduino Core:

1. **Initialize Arduino CLI configuration** (if not already initialized):
   ```powershell
   arduino-cli config init
   ```

2. **Add the ESP32 board index URL**:
   ```powershell
   arduino-cli config add board_manager.additional_urls https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```

3. **Update the core index**:
   ```powershell
   arduino-cli core update-index
   ```

4. **Install the ESP32 platform core**:
   ```powershell
   arduino-cli core install esp32:esp32
   ```

---

## 4. Hardware Identification & Verification

> [!NOTE]
> **TO BE DONE AFTER THE PHYSICAL ESP32 IS CONNECTED.**
> Do not attempt these steps until you have plugged in the physical ESP32 board via a data-capable micro-USB / USB-C cable.

### Identify the COM Port
Run the board detection command:
```powershell
arduino-cli board list
```
This will output connected serial devices, for example:
```
Port         Protocol Type              Board Name  FQBN            Core
COM3         serial   Serial Port (USB) Unknown
```
*Note: If no COM port appears in Windows, verify that the USB-to-UART bridge driver is installed (common chips: Silicon Labs CP2102/CP2104 or WCH CH340).*

### Identify the ESP32 Board & FQBN
The standard Fully Qualified Board Name (FQBN) for the ESP32 WROOM-32 module is:
```
esp32:esp32:esp32
```
You can search all available ESP32 board definitions in the installed core:
```powershell
arduino-cli board listall esp32
```

---

## 5. How to Compile

You can verify and compile the sketch at any time without connecting hardware:

```powershell
arduino-cli compile --fqbn esp32:esp32:esp32 firmware/rfid-scanner
```

---

## 6. How to Upload

> [!NOTE]
> **TO BE DONE AFTER THE PHYSICAL ESP32 IS CONNECTED.**
> Do not execute the upload command until the physical ESP32 is attached and its COM port is identified.

Upload the compiled binary to the ESP32 (replace `COMx` with your identified COM port, e.g., `COM3`):

```powershell
arduino-cli upload -p COMx --fqbn esp32:esp32:esp32 firmware/rfid-scanner
```

To open the serial monitor after uploading to observe logs (115200 baud):
```powershell
arduino-cli monitor -p COMx -c baudrate=115200
```

---

## 7. Provisioning and configuration

This firmware contains no Wi-Fi credentials, API URL, or signing secret in source. On a fresh boot it derives a stable ID from the ESP32 eFuse MAC and opens `RFID-SETUP-xxx`. Connect a phone or laptop to that access point and browse to `http://192.168.4.1` to enter the network, HTTPS server URL, device ID, and the one-time signing secret created in **System Settings → RFID**.

Version 2.1.0 stores complete active and pending JSON records in separate NVS keys, checks every record write by reading it back, and still reads the legacy key format. A pending Wi-Fi change must associate within 15 seconds and authenticate with the HTTPS server before it replaces the active configuration. RF power must also be accepted by the reader. Failed migration restores the prior network, reader power, and API client. Boot recovery performs the same checks before committing a pending record. Holding GPIO 27 for eight seconds opens the portal without deleting the identity or scanner settings.

Version 2.1.1 corrects the reader-information query to include hardware selector `0x00` (`BB 00 03 00 01 00 04 7E`), validates the response type and selector, and excludes the selector from the version string. Startup retries the query three times and logs detection and RF-power acknowledgement separately. The command format is documented in the [M100-compatible module protocol](https://docs.electron.id/el-uhf-rmt01/frame-examples.html). If readiness remains false, check the reader's power supply, UART wiring, and baud rate; a successful ESP32 heartbeat alone does not verify the reader.

The setup hotspot uses a random, saved 16-character WPA2 PIN. The local operator reads this PIN from the USB serial monitor when the portal opens. Existing predictable setup PINs are replaced on first use. The portal closes after five minutes without a page request or save attempt, and an outage cannot reopen it continuously.

Single trigger repeats polling until the first tag is found, then stops. Inventory window repeats polling until the configured timeout or the remaining delivery-buffer capacity is reached, removing duplicate EPCs within the trigger. The buffer holds at most 100 tag events. RF conditions determine which tags can be detected; verify inventory performance on the actual reader before operational use.

Scans are stored in a bounded NVS delivery queue and uploaded in batches of up to 20. Failed uploads retry with exponential backoff. Event identifiers prevent duplicate server events when a response is lost. A full or unhealthy buffer blocks new scans. If saving fails, the serial monitor reports it; keep the device powered while it retries. Database event identifiers must be retained for at least as long as pending device queues can be replayed; do not purge deduplication records independently of that policy.

The normal configuration endpoint excludes Wi-Fi credentials. Version 2.1.0 uses the authenticated POST `/api/hardware/rfid/config/candidate` endpoint to download one complete settings/network snapshot. Legacy network endpoints remain available to older firmware. Every API call includes `X-Device-ID`, `X-Timestamp`, `X-Nonce`, and `X-Signature`. The signature is HMAC-SHA256 over timestamp, nonce, method, path, and SHA256 of the raw body. The scanner synchronizes time with NTP before requesting, and the server rejects stale or replayed requests. No signing secret is printed to Serial.

Reconnection uses exponential backoff and a setup AP becomes available after a prolonged outage. Heartbeats report firmware, IP, RSSI, uptime, readiness, and the committed configuration version. Reader scans and synchronous network operations temporarily pause button processing; allow the scan or request to finish before holding the recovery button.

Deploy the Laravel code and run `php artisan migrate` before flashing version 2.1.0. Build the frontend with `npm run build`. Flash using the existing selective-image script, which preserves NVS; do not flash an entire merged image over saved credentials. System Settings shows requested and confirmed versions, pending/applied/failed/rolled-back status, and reader readiness. Station IDs are assigned to scan events on the server and can be selected automatically in the receiving screen. Buzzer, warehouse operating mode, and browser debounce controls are marked unavailable until their hardware/workflow behavior is implemented. Disabling a scanner disables server access; it does not power off the reader. Secret rotation still requires local provisioning, and OTA firmware installation is not implemented.

### Production TLS

The firmware validates HTTPS servers against the public root CAs used by the production Google and Cloudflare certificate chains. It synchronizes the ESP32 clock with NTP immediately after Wi-Fi connects so certificate validity dates can be checked. No insecure TLS fallback is enabled. If the production host changes to a certificate chain anchored by another CA, add that public root to `include/tls_roots.h` before deployment.

## 8. Laravel API Communication Architecture

The firmware will bridge physical RFID tag detections with the Laravel application:

```
[ UHF RFID Tag ] 
       │ (UHF 865-928 MHz)
       ▼
[ YRM100 UHF Module ]
       │ (Hardware UART: RX/TX)
       ▼
[ ESP32 WROOM-32 ]
  ├── Reads EPC tag memory buffer
  ├── Debounces trigger button press
  ├── Assembles JSON payload (EPC, RSSI, timestamp, scanner_id)
  └── Transmits over HTTPS/Wi-Fi
       │
       ▼ (HTTPS POST /api/v1/rfid/scan)
[ Laravel Application Backend ]
  ├── Authenticates Bearer API Token
  ├── Validates tag payload
  └── Processes inventory / asset tracking transaction
```

### Communication Specifications:
1. **Network Protocol**: Wi-Fi Station Mode (`WiFi.h`, `HTTPClient.h` / `WiFiClientSecure.h`).
2. **Payload Format**: Standard JSON encoded via `ArduinoJson`:
   ```json
   {
     "scanner_id": "SCANNER_01",
     "epc": "E280116060000204764B29E3",
     "rssi": -58,
     "timestamp": 1757342212
   }
   ```
3. **Security & Authentication**: HTTP Authorization header with a pre-shared API Bearer Token configured on the device.
