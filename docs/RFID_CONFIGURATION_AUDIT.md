# RFID configuration audit

Date: 10 October 2026 (Asia/Singapore)

Scope: ESP32 firmware, YRM100 reader driver, configuration API and authentication, System Settings RFID UI, scanner and receiving feed consumers, device models, provisioning, flashing script, and existing RFID tests. This is a source audit and compilation check, not a physical-device test. At the initial audit, no application or firmware source was changed or flashed.

Implementation follow-up: the findings below describe the original audit state. Firmware 2.1.0 and the accompanying application changes address findings 1–6 and 8–12. Finding 7 is addressed by disabling and labeling the unsupported controls, rather than inventing a buzzer pin or incomplete workflow. See `firmware/rfid-scanner/README.md` for deployment, behavior, limits, and required physical checks. Firmware installation, eFuse hardening, remote secret handover, and asynchronous button processing are outside this settings implementation.

Implementation verification: the updated firmware compiles; the frontend production build and TypeScript checks pass; 62 related RFID and System Settings tests pass (402 assertions), including eight new regression tests. The earlier autoloader limitation was resolved by running the installed PHP environment outside the sandbox. No physical device was flashed or tested. Deploy the database migration before using the updated application and flash firmware 2.1.0 once to enable its new device behavior.

## Assessment

Remote configuration exists. An admin save increments the server configuration version. The connected scanner checks that version on its next heartbeat, fetches settings, applies them, and stores them in Preferences/NVS. The default heartbeat is 30 seconds; blocking scans and requests can delay it. This mechanism does not yet provide reliable end-to-end confirmation or complete inventory-mode behavior.

## Findings requiring fixes

### 1. P1 — Inventory window does not initiate repeated inventory

Evidence: `firmware/rfid-scanner/src/yrm100.cpp:145`, `firmware/rfid-scanner/rfid-scanner.ino:30`.

Both modes send one single-poll command, `0x22`. Single mode returns after the first valid EPC. Inventory mode continues listening, but does not repeat the poll or initiate a multiple-inventory command. Switching modes remotely changes the flag, but cannot deliver the intended one-trigger inventory of detectable tags throughout the timeout. Implement repeated or supported multiple inventory, retain EPC deduplication, and stop cleanly when the window expires. Verify the command sequence against the actual reader and hardware. Reading every physical tag cannot be guaranteed by a timeout alone.

### 2. P1 — A failed network download can permanently skip the Wi-Fi update

Evidence: `firmware/rfid-scanner/rfid-scanner.ino:32`, `firmware/rfid-scanner/src/api_client.cpp:69`.

The return value of `fetchNetworkConfiguration()` is ignored. If general settings download succeeds but the network request fails, `applyCandidate()` can commit the new version with old credentials. Future heartbeats see matching versions and do not retry. Distinguish a successful response with no network update from a failed download, and commit only a complete configuration.

The two endpoints can also return different versions if an admin saves between requests. The network response version is not checked. Fetch a consistent snapshot or require matching versions before applying.

### 3. P1 — Connectivity changes are committed without server verification

Evidence: `firmware/rfid-scanner/rfid-scanner.ino:14`, `firmware/rfid-scanner/src/device_wifi_manager.cpp:18`.

Wi-Fi migration tests association, but does not verify that the new network can reach and authenticate with Laravel. A changed server URL is not tested at all. Either change can leave the scanner disconnected from remote management after being committed. Authenticate against the candidate server through the candidate network before committing; restore the old configuration on failure. The current TLS trust roots also limit which HTTPS certificate chains are accepted.

The applied-status request is sent before `apiClient.configure(config)`, so a URL change is acknowledged to the old endpoint rather than demonstrating success with the new endpoint.

### 4. P1 — Device-memory writes can report success despite failure or interruption

Evidence: `firmware/rfid-scanner/src/config_manager.cpp:26`, `firmware/rfid-scanner/src/provisioning_portal.cpp:148`.

Every Preferences write result is ignored. `write()` returns true after opening the namespace even if an individual write fails. The active record is overwritten key by key while an existing valid marker can remain set. Power loss can therefore leave a mixture of old and new fields marked valid. The setup portal also ignores the pending-save result before telling the user it saved and rebooting. Check writes and readback, and use a recoverable complete-record commit strategy.

If the runtime commit fails after Wi-Fi or RF power changed, the failure path does not restore those changes. Boot-time pending recovery commits after Wi-Fi association without completing the same server and reader checks as runtime application.

### 5. P1 — JSON string parsing corrupts valid credentials

Evidence: `firmware/rfid-scanner/src/api_client.cpp:63`.

The parser stops at the next quote and only decodes escaped slashes. A password containing a quote or backslash can be truncated or retain JSON escapes; Unicode SSIDs are also not decoded. Use a proper JSON parser and validate the complete payload. Blank passwords currently mean preserve the old password across the UI, backend, and firmware, so migrating from a protected network to an open network is unsupported.

### 6. P2 — Settings UI cannot confirm the scanner applied a version

Evidence: `app/Http/Controllers/Admin/SystemSettingController.php:74`, `app/Http/Controllers/Hardware/RfidDeviceController.php:67`, `resources/js/Pages/Admin/SystemSettings/Components/RfidSettings.tsx:46`.

The displayed version is the requested server version. Heartbeats supply the local version, but the backend does not persist it. Application status is cached for one day; Test Connection returns it, but the UI displays only the heartbeat message. Persist reported device version and application status, expose them in the settings page, and show pending/applied/failed/rolled-back states tied to the requested version. An online heartbeat also does not prove `scanner_ready` is true.

### 7. P2 — Several exposed settings have no operational implementation

Evidence: `firmware/rfid-scanner/include/config_manager.h:9`, `resources/js/Pages/Admin/SystemSettings/Components/RfidSettings.tsx:97`.

`buzzerEnabled` is downloaded and stored but never drives a buzzer. No buzzer pin is defined. Warehouse operating mode and browser debounce are stored/validated settings, but no operational consumers were found in the inspected application source. Implement their behavior or clearly identify them as unavailable. GPIO assignments remain fixed in firmware.

### 8. P2 — RFID tagging can lose burst scans and mix devices

Evidence: `resources/js/Pages/RFID-Scanner/hooks/useRfidScanner.ts:60`, `app/Http/Controllers/Hardware/RfidDeviceController.php:119`.

The tagging hook reads only the global latest cached scan and ignores the ordered `events` feed. Multiple scans between polls overwrite one another from this consumer's perspective, and it does not select a device. Use the ordered cursor feed and explicit device selection, as the receiving hook already does.

### 9. P2 — Station selection cannot match current firmware submissions

Evidence: `firmware/rfid-scanner/src/api_client.cpp:66`, `resources/js/Pages/Inventory/Receiving/hooks/useRfidScanner.ts:196`, `app/Http/Controllers/Inventory/RfidScannerController.php:359`.

The firmware sends EPC and RSSI without a station ID. Selecting a station in receiving filters for that station, which excludes these unassigned firmware events. Provide a server-side device/station mapping or a supported station setting and submission field.

### 10. P2 — Scan delivery has no retry and competes with configuration traffic

Evidence: `firmware/rfid-scanner/rfid-scanner.ino:30`, `firmware/rfid-scanner/src/api_client.cpp:66`, `routes/api.php:7`.

Each tag is posted individually. Offline scans are not retained; request failures are ignored by the caller. `submitScan()` marks any positive HTTP status as success, including 401, 429 and 500. The 120-per-minute hardware limiter covers scans, heartbeats and configuration requests together. A sustained inventory workload can exhaust it. Add explicit accepted-status handling, bounded retries with idempotency, and appropriate scan batching/rate limits. Unknown tags returning 404 are nevertheless recorded by the current backend, so distinguish that result from delivery failure.

### 11. P2 — Tagging polling exceeds its browser route rate limit

Evidence: `resources/js/Pages/RFID-Scanner/hooks/useRfidScanner.ts:15`, `routes/web.php:82`.

The default polling interval is 300 ms (about 200 requests per minute), while these routes are limited to 90 per minute. An active tagging session can repeatedly encounter HTTP 429 and report degraded/offline connectivity. Align polling and rate limits, including other traffic using the same limiter.

### 12. P2 — First device registration leaves no selected device

Evidence: `resources/js/Pages/Admin/SystemSettings/Components/RfidSettings.tsx:19`, `resources/js/Pages/Admin/SystemSettings/Components/RfidSettings.tsx:83`.

On an initially empty page, `selectedId` starts null. Registration and subsequent polling add devices without initializing that selection. Fields can remain empty and Save returns early until the user selects a device or reloads. Select the newly registered device explicitly.

## Additional boundaries and security observations

- Secret rotation immediately replaces the server secret. There is no remote staged secret handover; the scanner needs local provisioning of the new secret.
- Disable/revoke denies server access but does not stop physical scans, because scanning is still executed locally. The UI should describe access control accurately.
- The setup PIN is derived from the chip MAC, with a fixed fallback. It is not a random secret. Portal timeout measures time since opening, despite describing inactivity; prolonged outages can reopen it after expiry.
- Portal device-ID validation accepts underscores; hardware authentication and registration reject them. Align these rules.
- API calls and scans block the main loop. Button processing and heartbeats pause during scanning, network migration, and sequential HTTP uploads.
- No OTA firmware-update implementation was found. Remote settings support does not provide remote firmware installation.
- Production hardening documentation is guidance, not evidence that secure boot, flash encryption, or eFuse protections are enabled on the physical device. Its irreversible procedures were not run.

## Validation

- Arduino compilation passed for `esp32:esp32:esp32`: 1,078,396 bytes program storage (82%), 49,160 bytes global RAM (15%). No flashing occurred.
- PHP syntax checks passed for eight RFID controllers, request, middleware and models.
- Existing RFID configuration/security/scanner/receiving feature tests could not start: `vendor/autoload.php` is missing. Dependencies were not installed during this audit.
- Existing configuration tests cover registration, authenticated configuration/network responses, encryption and access controls. They do not exercise physical reader inventory, device-memory interruption recovery, or end-to-end remote application.
- The physical scanner's installed firmware, actual RF behavior, connectivity rollback and application acknowledgement remain unverified.

## Recommended implementation order

1. Complete and verify the configuration download/apply/rollback transaction, JSON parsing, and durable storage.
2. Implement and verify inventory scanning on the actual YRM100 device.
3. Persist applied-version telemetry and expose accurate status in System Settings.
4. Fix scan delivery, browser polling, device/station routing and inactive controls.
5. Run backend tests and physical acceptance checks before flashing the repaired firmware for operational use.
