# RFID Wi-Fi configuration audit

Audit date: 13 October 2026 (Asia/Singapore). Source revision: `3beb37d`.

## Result

System Settings → RFID can change the scanner's Wi-Fi only while the scanner can reach the configured NEMIX HTTPS server. Saving writes a new requested configuration to the database; the browser does not connect directly to the scanner. The scanner downloads the candidate after a successful heartbeat and attempts the migration.

If the old Wi-Fi is unavailable, a dashboard save remains queued. Recover the scanner through its local hotspot, then reconcile the dashboard credentials. Moving the laptop to another network does not automatically move the scanner.

## Procedure while the scanner is online

1. Open System Settings → RFID and select the correct device.
2. Confirm it is online. Ensure the new network is available at the scanner and can reach the existing HTTPS server.
3. Enter the exact new Wi-Fi SSID and its password. Leave Open Wi-Fi network unchecked for a password-protected network. A blank password retains the server's previously saved password; explicitly enter the new password when changing networks.
4. Keep Server URL set to the NEMIX HTTPS origin, without a path, unless the system itself moved. The scanner hotspot address is not the Server URL. Keep the device signing secret unchanged for a routine Wi-Fi change.
5. Click the device's Save & Apply Configuration button. The immediate success message means queued, not connected.
6. Release the scan trigger and wait for a heartbeat. The default interval is 30 seconds; the configured interval can be 10–3,600 seconds. Migration also takes connection and HTTPS verification time.
7. Wait for Configuration: applied, with the device confirmed version equal to the requested version and a fresh online heartbeat. Failed or rolled back requires checking the error message and serial output.

The firmware stores a pending candidate, allows 15 seconds for Wi-Fi association, authenticates against the candidate HTTPS server, checks reader readiness/RF power, then commits the configuration. Failure attempts to restore the old configuration. Successful Wi-Fi association alone is insufficient: TLS, the signing secret, clock synchronization and server access must also work.

## Procedure when the scanner is offline

1. Record the new credentials in the dashboard first if possible. This avoids an older queued server configuration restoring the previous network after local recovery.
2. Connect USB and open the serial monitor at 115200 baud. On firmware supporting the startup gesture (2.2.0+), hold the physical scan trigger while powering on or pressing EN/RESET; hold for eight seconds, then release.
3. Read `[PORTAL] Setup PIN (local operator only): ...`. Join `RFID-SETUP-0A4` using that PIN. Current source generates and saves a random 16-character PIN; it cannot be derived from `0A4` and is distinct from both the router password and device signing secret.
4. Open `http://192.168.4.1`. Enter the new router SSID/password. Retain the existing HTTPS Server URL and Device ID; leave the token field blank to retain the existing secret. Save and connect.
5. Check the USB logs after reboot. Local save means a pending record was stored, not that the connection succeeded. The pending configuration goes through the same migration checks.
6. Verify the scanner reconnects. Ensure the dashboard contains the same SSID and explicitly save the matching password there. Local setup does not synchronize credentials back to the server. Confirm the resulting requested version is applied.

Local recovery currently also requires a working RFID reader because of finding 2 below. If an obsolete queued network keeps being downloaded, update the dashboard credentials before repeating local recovery.

## Findings

### 1. [P2] Local Wi-Fi changes can be overwritten by stale dashboard credentials

Evidence: `firmware/rfid-scanner/src/provisioning_portal.cpp:141–156`, `app/Http/Controllers/Hardware/RfidDeviceController.php:22–34`, `firmware/rfid-scanner/src/api_client.cpp:89–105`, `resources/js/Pages/Admin/SystemSettings/Components/RfidSettings.tsx:47–54`.

Local setup copies the active record and changes credentials without reconciling them with the server. Every newer remote candidate contains the server's stored Wi-Fi whenever its SSID is nonempty, even when the administrator only edits scan mode or heartbeat interval.

Example: server and scanner use network A at version 2. Local setup successfully changes the scanner to B, retaining version 2. A later scan-mode save creates version 3 containing A; the scanner tries A again. A pending version 3 already on the server can cause this immediately after local recovery. If A is available, the scanner can return to A; otherwise it attempts rollback and retries on subsequent heartbeats.

Recommended correction: track Wi-Fi changes separately from other settings, explicitly distinguish retaining local credentials from migrating a network, and report the connected SSID to the dashboard.

### 2. [P2] Reader failure prevents Wi-Fi recovery

Evidence: `firmware/rfid-scanner/rfid-scanner.ino:40–60`, particularly line 45; local pending recovery calls `applyCandidate()` at lines 141–144.

Even when the new Wi-Fi connects and the server authenticates, `!scannerReady` rejects the candidate. Thus a reader power/UART fault can make both remote and local Wi-Fi changes roll back. This couples network administration to RFID hardware health.

Recommended correction: allow a verified Wi-Fi-only recovery to commit while separately reporting that scanning is unavailable. Preserve reader validation for reader setting changes.

### 3. [P2] Applied status does not prove the displayed Wi-Fi is active

Evidence: `firmware/rfid-scanner/src/provisioning_portal.cpp:141–148`, `firmware/rfid-scanner/src/api_client.cpp:75–86`, `app/Http/Controllers/Hardware/RfidDeviceController.php:123–126`, `app/Http/Controllers/Admin/SystemSettingController.php:86`.

The local portal preserves the configuration version. Heartbeats report a version and IP/RSSI, but no active SSID. When that version equals the server version, the backend marks the configuration applied. After a local change from A to B, the dashboard can therefore show SSID A and applied even though the scanner uses B.

Recommended correction: show requested and device-reported network state separately, and require acknowledgement of the relevant network revision before claiming the network configuration was applied.

### 4. [P2] A changed SSID can silently reuse the wrong password

Evidence: `app/Http/Controllers/Admin/RfidDeviceSettingController.php:106–113`, `firmware/rfid-scanner/src/api_client.cpp:97–102`, `resources/js/Pages/Admin/SystemSettings/Components/RfidSettings.tsx:153`.

Saving a different SSID with a blank password retains the server's old password. If the server has no saved password, the candidate contains null and the firmware retains its local password. These semantics are useful when the network is unchanged but ambiguous when changing networks; a password-protected new network can be tried with unrelated credentials.

Recommended correction: require explicit password entry or an explicit reuse-password choice when the SSID changes; retain the open-network option.

## Dashboard limitations

- Test Connection reads the stored heartbeat; it does not issue a fresh network probe or test the unsaved SSID/password (`RfidDeviceSettingController.php:120–132`).
- Save & Apply Configuration can queue changes for an offline scanner, but the settings panel does not explain that local recovery is needed before delivery.
- Clearing the SSID field does not clear the saved server SSID; the update only writes a nonempty SSID. It therefore cannot be used to switch back to keeping locally provisioned credentials.
- Current source declares firmware 2.2.0 in `firmware/rfid-scanner/include/config.h`. Existing battery audit documentation refers to a previously flashed 2.3.0 build. The source audit does not establish which firmware is installed on the physical scanner; check its heartbeat or USB diagnostic output.

## Validation and scope

Reviewed the RFID settings UI, settings serialization and validation, admin update controller, authenticated hardware API, firmware main loop, Wi-Fi manager, local provisioning portal, configuration storage and JSON handling.

The existing `RfidDeviceConfigurationTest` and `RfidHmacSecurityTest` suites passed: **25 tests, 259 assertions**. Tests ran with SQLite `:memory:` and testing services. The first sandbox run could not open the vendor bootstrap; the authorized run outside the sandbox passed. These tests verify backend configuration/security behavior, not physical Wi-Fi migration or the firmware findings above.

No application or firmware implementation was changed, no device was flashed, and no live network credentials were changed. Findings about device transitions are source-based; hardware verification remains necessary.
