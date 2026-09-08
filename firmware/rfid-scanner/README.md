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

## 7. Future Laravel API Communication Architecture

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
