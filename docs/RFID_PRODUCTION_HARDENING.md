# NEMIX ESP32 UHF RFID Scanner — Production Hardware Hardening & Provisioning Guide

This document establishes the authoritative production security standard for the NEMIX ESP32 WROOM-32 UHF RFID handheld/fixed scanning hardware. 

> [!CAUTION]
> **IRREVERSIBLE HARDWARE OPERATION (EFUSE WARNING)**
> eFuses on the ESP32 WROOM-32 silicon utilize physical microscopic fuses that are **permanently burned** via electrical current. Once an eFuse bit is blown (burned to `1`), **it can NEVER be reversed or reprogrammed**. Burning incorrect keys or premature revocation of UART download mode will permanently brick or render the ESP32 chip unbootable. Follow every step in **Development Mode** on test chips before burning production silicon.

---

## 1. Threat Model & Physical Attack Surface

When deployed in field warehouses, inventory rooms, and distribution centers, handheld and fixed scanners are subject to physical possession attacks:

| Attack Vector | Mechanism | Risk Without Hardening | Mitigation |
| :--- | :--- | :--- | :--- |
| **Flash Memory Extraction** | External flash chip desoldering or UART bus sniffing via `esptool.py read_flash` | Full exposure of Wi-Fi credentials, NVS tokens, and HMAC-SHA256 device secrets | **ESP32 Flash Encryption (AES-XTS 256-bit)** |
| **Firmware Tampering / Replacement** | Flashing trojanized firmware to bypass authentication or sniff RFID tag traffic | Man-in-the-Middle on RFID inventory scans; injection of fraudulent stock records | **Secure Boot v2 (RSA-3072 Digital Signatures)** |
| **JTAG / In-Circuit Debugging** | Connecting hardware probes to JTAG pins to inspect registers and RAM | Extraction of volatile keys during active execution | **Disable JTAG via eFuses (`JTAG_DISABLE`)** |
| **UART ROM Download Exploitation** | Pulling GPIO0 LOW to force ROM bootloader mode | Direct flash read/write commands over serial port | **Disable or permanently restrict UART ROM Download Mode** |
| **Physical Enclosure Tampering** | Opening casing to tap SPI flash or UART lines | Silent probe implantation | **Tamper-evident seals, potted enclosure, internal switches** |

---

## 2. Prerequisites & Toolchain Setup

All provisioning must be executed in a secure hardware provisioning environment (isolated air-gapped machine or dedicated provisioning workstation).

### Required Hardware & Software
- Espressif Toolchain: `esptool.py` (v4.0+) and `espefuse.py`
- Python 3.10+ with `cryptography` package
- Quality CP2102/CH340 USB-to-UART bridge with stable 3.3V power supply (minimum 500mA rating during eFuse burning)
- Target: ESP32-WROOM-32 (Revision 1 or Revision 3 silicon)

```bash
pip install --upgrade esptool cryptography
esptool.py version
espefuse.py version
```

---

## 3. Flash Encryption Implementation

Flash Encryption protects the entire flash memory (bootloader, partition table, application firmware, NVS storage) using AES-XTS-256 hardware encryption.

### Step 3.1: Development Mode vs. Release Mode

* **Development Mode (`FLASH_CRYPT_CNT` burnable up to 3 times)**:
  * Allows re-flashing plaintext binaries over UART up to 3 times. The ROM bootloader encrypts new binaries in-place upon subsequent boot.
  * Recommended for field testing and pilot validation.
* **Release Mode (`FLASH_CRYPT_CNT` permanently burned to max, UART ROM download restricted)**:
  * **MANDATORY FOR PRODUCTION**.
  * The ESP32 will **only** boot encrypted flash.
  * Disables plaintext flashing over UART completely. Firmware updates can only occur via signed OTA or designated authenticated portals.

### Step 3.2: Flash Encryption Key Generation (Host-Generated)

Generate a cryptographically secure 256-bit key on the secure provisioning host:

```bash
# Generate 256-bit symmetric flash encryption key
espsecure.py generate_flash_encryption_key flash_encryption_key.bin

# Back up flash_encryption_key.bin into a hardware security module (HSM) or secure vault!
# If this key is lost, the device can never be debugged or recovered.
```

### Step 3.3: Burning the Flash Encryption Key to eFuse Block 0/Block 1

```bash
# Verify initial eFuse status
espefuse.py --port /dev/ttyUSB0 summary

# Burn the AES key into BLK1 (BLOCK1)
espefuse.py --port /dev/ttyUSB0 burn_key flash_encryption flash_encryption_key.bin

# Set FLASH_CRYPT_CONFIG to 0xF (enables full flash encryption addressing)
espefuse.py --port /dev/ttyUSB0 burn_efuse FLASH_CRYPT_CONFIG 0xF
```

### Step 3.4: Burning Release Mode eFuse (`FLASH_CRYPT_CNT`)

```bash
# In PRODUCTION ONLY: Permanently burn FLASH_CRYPT_CNT to lock into Release Mode
espefuse.py --port /dev/ttyUSB0 burn_efuse FLASH_CRYPT_CNT 0x7F
```

---

## 4. Secure Boot v2 Implementation

Secure Boot v2 creates a cryptographic chain of trust from the hardware ROM to the application code using RSA-3072 digital signatures.

### Step 4.1: Generate RSA-3072 Signing Keys

```bash
# Generate private RSA-3072 signing key (strictly protected on HSM / offline vault)
espsecure.py generate_signing_key --version 2 secure_boot_signing_key.pem

# Extract the public key digest (SHA-256 hash of RSA-3072 public key)
espsecure.py digest_rsa_public_key --keyfile secure_boot_signing_key.pem --output public_key_digest.bin
```

### Step 4.2: Burn the Public Key Digest to eFuse Block 2

The ESP32 ROM bootloader only needs the public key digest stored in write-protected eFuses:

```bash
# Burn public key digest to BLOCK2
espefuse.py --port /dev/ttyUSB0 burn_key secure_boot_v2 public_key_digest.bin

# Enable Secure Boot v2 in eFuses
espefuse.py --port /dev/ttyUSB0 burn_efuse ABS_DONE_1
```

### Step 4.3: Sign Firmware Binaries

All binaries (bootloader and application) must be signed with the private RSA-3072 key before flashing:

```bash
# Sign the compiled application binary
espsecure.py sign_data --version 2 --keyfile secure_boot_signing_key.pem --output firmware_signed.bin build/rfid-scanner.bin

# Sign the bootloader
espsecure.py sign_data --version 2 --keyfile secure_boot_signing_key.pem --output bootloader_signed.bin build/bootloader.bin

# Verify signature integrity before flashing
espsecure.py verify_signature --version 2 --keyfile secure_boot_signing_key.pem firmware_signed.bin
```

---

## 5. Security eFuse Lockdown (Anti-JTAG & UART Restriction)

To eliminate physical bus exploitation, disable hardware debugging interfaces and lock down download mode:

```bash
# 1. Permanently disable JTAG hardware debugging
espefuse.py --port /dev/ttyUSB0 burn_efuse JTAG_DISABLE

# 2. Disable UART Download Mode or restrict to secure mode
# Note: On ESP32 ECO3 chips, UART_DOWNLOAD_DIS permanently disables the serial bootloader.
# Ensure OTA or authenticated provisioning is 100% verified before this step!
espefuse.py --port /dev/ttyUSB0 burn_efuse UART_DOWNLOAD_DIS

# 3. Write-protect the key blocks
espefuse.py --port /dev/ttyUSB0 burn_efuse WR_DIS_BLK1
espefuse.py --port /dev/ttyUSB0 burn_efuse WR_DIS_BLK2
```

---

## 6. Verification and Audit Commands

Run the comprehensive eFuse summary tool to confirm that all protections are active:

```bash
espefuse.py --port /dev/ttyUSB0 summary
```

### Expected Production Security Status

| eFuse Field | Production Expected Value | Description |
| :--- | :--- | :--- |
| `FLASH_CRYPT_CNT` | `0x7F` or `0xFF` | Flash Encryption permanently locked in Release mode |
| `FLASH_CRYPT_CONFIG` | `0xF` | Full address space encryption enabled |
| `ABS_DONE_1` | `True` / `1` | Secure Boot v2 enforced by hardware ROM |
| `JTAG_DISABLE` | `True` / `1` | Hardware JTAG pins permanently disabled |
| `UART_DOWNLOAD_DIS` | `True` / `1` | ROM download mode locked |
| `WR_DIS` | `0x...` | Write-protection active on encryption and secure boot keys |

---

## 7. Physical Enclosure & Hardware Anti-Tamper Measures

1. **Tamper-Evident Security Seals**:
   - Apply destructible tamper-evident vinyl barcode labels across the enclosure seam screws.
   - Any physical opening fractures the label into tiny fragments (`VOID` pattern).
2. **Epoxy Potting of Critical Subsystems**:
   - Pour industrial electronic-grade polyurethane/epoxy compound over the ESP32 module, YRM100 reader header, and SPI flash to prevent solder-tack or microprobe attacks.
3. **Hardware Anti-Tamper Microswitch**:
   - Connect an internal normally-closed chassis microswitch to an ESP32 RTC GPIO.
   - If the enclosure is opened, the switch triggers an immediate hardware interrupt that clears the NVS credentials partition (`ConfigManager::resetConfiguration(false)`).

---

## 8. Pre-Deployment Scanner Checklist

Before releasing any scanner to warehouse operations:

- [ ] 1. Device MAC and hardware eFuse UUID registered in NEMIX admin portal (`/admin/system-settings`).
- [ ] 2. Unique per-device HMAC-SHA256 shared secret (64-char hex) generated and provisioned.
- [ ] 3. WPA2 Setup PIN (minimum 8 chars) confirmed in NVS via `ConfigManager::getOrGenerateSetupPin()`.
- [ ] 4. Server URL configured strictly with `https://` production domain; plain `http://` rejected.
- [ ] 5. Firmware signed with production RSA-3072 offline key.
- [ ] 6. `FLASH_CRYPT_CNT` burned to Release Mode.
- [ ] 7. `JTAG_DISABLE` verified via `espefuse.py summary`.
- [ ] 8. Tamper-evident seal applied and photographed with serial number logged.
