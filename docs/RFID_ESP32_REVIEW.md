# RFID and ESP32 review

Reviewed 13 October 2026 (Asia/Singapore). The original audit examined firmware 2.2.0; the implemented source now declares 2.4.0.

## Implementation follow-up

The findings below describe the original audit. Firmware 2.4.0 now adds bounded idle reader checks/recovery and transport diagnostics, allows network-only recovery when the reader is unavailable, and separates Wi-Fi revisions from general settings. Local recovery and legacy-record upgrades acknowledge the server's existing network revision before fetching candidates, preserving locally working credentials. The dashboard reports saved and connected SSIDs separately and can explicitly reapply saved Wi-Fi. Both setup paths require explicit credentials when changing SSID. Clearing the dashboard SSID retains the local network. README API/authentication details were corrected.

Deployment requires the new backend migration and frontend build before installing firmware 2.4.0. The implementation was prepared locally; no live migration, deployment or flashing was performed. See the firmware README for release behavior and physical acceptance checks.

Implementation validation: 68 RFID-related tests passed (476 assertions), including revision gating, explicit reapply, credential rejection without partial saves, SSID clearing, separate connected-network telemetry, legacy telemetry clearing and migration backfill/rollback. TypeScript and the production frontend build passed; the build reported the existing missing campus background, empty vendor chunks and large-chunk warnings. Firmware compile-time regression checks cover transport recovery and valid no-tag responses as well as the existing trigger checks. The final 2.4.0 ESP32 build passed: 1,111,832 bytes program storage (84%) and 49,296 bytes global RAM (15%), in `firmware/rfid-scanner/build/review-20261013`.

## Findings

1. **P1: Reader readiness is only checked at startup and cannot recover while idle.** `firmware/rfid-scanner/rfid-scanner.ino:129–139` initializes the reader, retries information three times and sets `scannerReady`. The main loop never retries initialization. A reader that becomes available after these attempts remains blocked until reboot. Conversely, UART failures during scans do not clear a previously true readiness flag. A fresh heartbeat therefore does not prove the reader still responds. Add bounded idle recovery and distinguish normal no-tag replies from transport failures.

2. **P2: A reader fault blocks network recovery.** `firmware/rfid-scanner/rfid-scanner.ino:45` rejects every candidate when `scannerReady` is false, including a locally provisioned Wi-Fi-only change. Even successful Wi-Fi association and authenticated HTTPS verification roll back. Separate network recovery from reader-setting verification and report scanning availability independently.

3. **P2: Local Wi-Fi changes can be overwritten by later dashboard saves.** Local provisioning copies the active configuration version (`firmware/rfid-scanner/src/provisioning_portal.cpp:141–148`). Every newer remote candidate includes the server's saved network when its SSID is nonempty (`app/Http/Controllers/Hardware/RfidDeviceController.php:22–34`). A scan-mode-only save can therefore restore an obsolete network after local recovery. Heartbeats do not report the active SSID, so matching versions can also show applied while the dashboard's SSID differs from the device. Track network changes independently and expose requested versus connected network state.

4. **P2: Changing SSID with an empty password reuses prior credentials.** `app/Http/Controllers/Admin/RfidDeviceSettingController.php:106–112` changes a nonempty SSID but retains its previous password unless a new password or open-network flag is supplied. Require explicit password entry or explicit reuse when changing SSID. Local provisioning has the same ambiguity.

5. **Documentation mismatch:** README section 8 describes `/api/v1/rfid/scan` and bearer authentication. The actual firmware uses `/api/hardware/rfid/scans` for queued batches and HMAC headers. Historical audit documents describe 2.3.0 diagnostics, but current firmware is 2.2.0 and sends no `reader_diagnostics`. The dashboard handles legacy heartbeats; its advanced diagnostics require matching firmware.

## Checked paths and behavior

Reviewed firmware entry point, trigger controller and compile-time checks, UART reader driver, Wi-Fi manager, provisioning portal, configuration storage, TLS/API client and persistent scan queue. Traced backend configuration, heartbeat, scan delivery, device authentication and browser tagging feed.

The current code includes repeated inventory polls, per-hold EPC deduplication, bounded persistent delivery, batch retries with event IDs, complete candidate configuration snapshots, HTTPS authentication checks before commit and rollback handling. The tagging hook consumes a selected device's ordered event feed at a one-second default interval.

Configured wiring contract: GPIO27 trigger to ground; GPIO26 reader enable; GPIO16 ESP32 RX connected to reader TX; GPIO17 ESP32 TX connected to reader RX. UART and debug serial are configured for 115200 baud. These assignments were read from source; physical wiring and supply voltage were not measured.

## Verification

- `php artisan test --filter=Rfid`: **61 passed, 432 assertions** using the configured SQLite in-memory test database.
- Arduino serial discovery found **COM11**, USB VID `1A86`, PID `7523`. Discovery did not identify an ESP32 board; a serial bridge alone does not verify installed firmware or RFID operation.
- `arduino-cli compile --fqbn esp32:esp32:esp32 --build-path storage/rfid-review-build firmware/rfid-scanner`: **passed**. Program storage: 1,108,676 bytes (84%); global RAM: 49,240 bytes (15%). Includes production trigger-controller compile-time checks. Build artifacts were subsequently moved to the ignored `firmware/rfid-scanner/build/review-20261013` directory.

No implementation changes, firmware flashing, live credential changes or physical RF measurements were performed. The pre-existing untracked Wi-Fi audit was preserved.
