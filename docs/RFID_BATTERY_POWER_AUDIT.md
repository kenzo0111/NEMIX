# ESP32 / YRM100 battery-power audit

Date: 12 October 2026 (Asia/Singapore). Source examined: firmware 2.2.0 in this checkout.

Implementation follow-up: the findings and original source line numbers below describe 2.2.0. Firmware 2.3.0 now adds bounded idle reader recovery, RF-power acknowledgement/readback, continuing idle checks, scan error/capture counters and distinct queue/storage block reasons. Heartbeats persist optional reader diagnostics; settings display communication status separately from captured tags and mask stale readiness. Older heartbeats clear prior-session diagnostics. See `firmware/rfid-scanner/README.md` for deployment order and behavior. Physical battery operation remains unverified; no voltage sensor or physical VCC switching has been added.

Implementation validation: firmware 2.3.0 compiles for `esp32:esp32:esp32`, using 1,111,376 bytes of program storage (84%) and 49,304 bytes of global RAM (15%). Compile-time checks verify that repeated transport failures require recovery, a valid response clears that requirement, and repeated valid no-tag replies do not require recovery. The two RFID backend suites pass: 30 tests, 289 assertions, including four new tests for diagnostic persistence, validation, legacy heartbeats and stale status masking. TypeScript and the production frontend build pass; the build reports existing asset/chunk warnings. A fresh-heartbeat regression also exposed SQLite datetime interpretation; heartbeat storage now uses application time for SQLite/MySQL and retains UTC for PostgreSQL timestamptz. Tests are database/API checks, not physical RF tests. No migration was applied to the user's live database and no device was flashed.

## Follow-up audit: dashboard says ready but battery scans fail

**Confirmed explanation of the displayed status:** `scannerReady` means reader information and RF-power-setting commands succeeded at startup. It does not mean an inventory round succeeded, a tag was read, the reader still responds, queue capacity is available, or supply voltage is healthy. The current code can report ready indefinitely through unsuccessful scans.

The status path is:

1. `firmware/rfid-scanner/rfid-scanner.ino:135` and `:138` set the flag after reader information and power acknowledgement.
2. `rfid-scanner.ino:170` sends that flag on heartbeats; `src/api_client.cpp:81` serializes `scanner_ready`.
3. `app/Http/Controllers/Hardware/RfidDeviceController.php:104` stores the incoming boolean. It does not require a scan event or inspect reader power.
4. `app/Http/Controllers/Admin/SystemSettingController.php:83` exposes the stored boolean. `resources/js/Pages/Admin/SystemSettings/Components/RfidSettings.tsx:127` renders it as “Reader: ready”. The UI polls every five seconds, but it polls this stored value, not the module.

### Ranked source findings relevant to this symptom

| Priority | Finding | Why ready can coexist with failure | Evidence |
| --- | --- | --- | --- |
| P1 | No continuing reader-health update | Scan errors and timeouts do not clear or refresh startup readiness; a later reader failure can leave ready true. | `rfid-scanner.ino:135`, `:138`, `:170`; `src/yrm100.cpp:145`, `:213` |
| P2 | Readiness display does not expire with heartbeat | The UI renders saved readiness independently of online/offline status. A disconnected battery session can retain readiness reported during a prior USB session. Even a fresh heartbeat does not verify RF inventory. | `SystemSettingController.php:75`, `:83`; `RfidSettings.tsx:127`; `RfidDevice.php:35` |
| P2 | Queue/storage blocks scanning independently | Full 100-event queue, dirty storage or invalid saved queue prevents inventory without changing reader readiness. | `include/scan_queue.h:70`; `rfid-scanner.ino:68`, `:82` |
| P2 | UHF errors are swallowed | No tag, reader error and UART timeout collapse into no captured tags; the underlying reason is not sent to the dashboard. | `src/yrm100.cpp:198`, `:241`, `:243` |
| P2 | Trigger hold defers delivery and heartbeats | Inventory reads can succeed locally while dashboard events remain absent until release. A stuck active-low trigger can keep delivery and status updates suspended. | `rfid-scanner.ino:158`, `:164`, `:176` |

The “Test Connection” action is also a database/heartbeat check, not a command sent to the reader: `app/Http/Controllers/Admin/RfidDeviceSettingController.php:125–130`. `isOnline()` checks heartbeat age with a three-interval window (90 seconds at the default interval). The live-feed controller similarly derives online status from heartbeats (`Inventory/RfidScannerController.php:283–289`) without consulting reader health. These are status/diagnostic limitations, not proof that the backend causes the physical RF failure.

### Additional display condition to check

The tagging page's first live-feed request uses `initialize=1` and sets a cursor to the latest stored event. The server deliberately returns no historical events for that request (`resources/js/Pages/RFID-Scanner/hooks/useRfidScanner.ts:84`, `:101`; `Inventory/RfidScannerController.php:368`). Open the scanning session and select the correct device before scanning. Reads delivered before initialization are not replayed as new scans. This behavior applies equally to USB and battery operation.

### What the user's observations establish

- A measured 5 V between reader VCC/GND establishes voltage at the measurement instant; no RF-load trace or separate ground-continuity result has been supplied.
- The same tag works with USB-powered ESP32 and reader VCC on ESP32 3V3. The failing setup uses battery/converter power and reader VCC on converter VO+. Supply path, voltage, grounding and startup changed together, so this does not isolate battery operation alone.
- If the battery session has a fresh heartbeat reporting ready, complete loss of reader power/UART at that session's startup is less likely. RF-load failure, a later reset, scan gating, or absent upload remain possible. If last-seen is stale, the displayed readiness may describe the USB session.
- No firmware branch depends on USB host connection; no battery-voltage sensing, converter control, or automatic battery/USB RF-power adjustment is implemented. Both arrangements use the saved `rfPower` setting.

### Next decisive evidence

Check the dashboard firmware version and last-seen timestamp first. In a battery-only cold boot, capture startup and one press/release at 115200 baud without supplying USB power to the ESP32. Interpret the result:

- No `[SCAN]` start/count output: investigate trigger GPIO27, startup wait, suppressed boot hold, or blocking idle network calls.
- `[SCAN] Reader unavailable or delivery queue full.`: firmware refuses inventory; expose queue count/storage state to distinguish the gates.
- Single mode reports zero captured tags, or inventory finishes with zero: investigate actual reader inventory replies and supply under RF load. Current driver diagnostics cannot identify the precise cause.
- Capture count is positive: RF reading occurred; inspect release, queue persistence, `/api/hardware/rfid/scans` HTTP result, selected device and browser session initialization.

Recommended fixes for review: distinguish startup communication from current health, freshness and last successful inventory; report queue count/block reason and last UHF error/transport counters; recover from confirmed communication failure while idle; avoid interpreting normal no-tag inventory as a hardware failure. These changes improve diagnosis and recovery but cannot repair inadequate hardware power.

### Verification of dashboard and delivery paths

Four existing backend tests passed (40 assertions): authenticated heartbeat, idempotent batch delivery, heartbeat expiry and selected-scanner live-feed status. They confirm the heartbeat/event paths behave as coded, not RF performance. The unchanged firmware compiled successfully earlier in this audit. No new firmware or application behavior was implemented, and no physical scanner was flashed or tested.

## Assessment and limits

No single physical root cause is confirmed. The user subsequently supplied wiring photos and a listing for a miniature 0.9–5 V input / 5 V output boost converter. They describe YRM100 GND on the input-side ground and ESP32 GND on the output-side ground, with ESP32 VIN and YRM100 VCC sharing the converter output. Battery type, converter IC/current capability, voltage under load, battery-only UART logs, and installed firmware version remain unverified. The shared ChatGPT conversation could not be fetched. This report therefore separates confirmed source findings from hardware hypotheses. No firmware was changed or flashed and no physical reader was tested.

### Follow-up from wiring photos

Sharing the regulated output between ESP32 VIN and YRM100 VCC is a valid topology if the development board accepts that input voltage, the reader accepts it, and the converter maintains it under their combined load. Connecting reader ground to input ground and ESP32 ground to output ground is also valid for a converter whose input and output negative terminals are common; verify continuity with all power disconnected. The photos do not conclusively identify every pad, the converter IC, or its current capability. The listing's voltage range does not establish available output current.

The converter and its jumper/connector power path are now the leading hardware suspects to test, rather than assuming the reader VCC was connected to the ESP32 3.3 V supply. Measure output at the converter and at YRM100 VCC during inventory: droop at both points implicates battery/converter input or output capability; a stable converter output with low reader voltage implicates connections and wiring. Measure battery voltage at converter input during the same event. If all rails stay within specification, investigate reader/UART errors and firmware startup gating next.

Expected connections: battery positive through the switch to converter VI+, battery negative to converter input GND, converter VO+ to both ESP32 VIN and YRM100 VCC, and common ground to both devices. VI and VO label voltage input/output, not polarity; verify the exact board pads before moving wires. Do not infer positive/negative from wire colors alone.

### Follow-up: successful USB test also changed reader supply

The user reports approximately 5 V measured across YRM100 VCC/GND in the converter arrangement, but has not confirmed a measurement during RF inventory or a separate unpowered continuity result. They further report that the same tag reads when the ESP32 is USB-powered **and the reader VCC/GND wires are moved to ESP32 3V3/GND**. This is not a controlled USB-versus-battery comparison: reader voltage, supply path, ground connection and possibly startup sequence changed together.

The successful test demonstrates a working tag/read path in that arrangement. It makes an unconditional tag/parser failure less likely, but does not prove adequate converter transient performance, valid ground continuity, correct 5 V operation of the exact variant, or recovery from a prior failed startup. Do not conclude that 5 V itself is the cause or prescribe permanent ESP32-3V3 powering from this observation. The reference YRM100 operating table lists 3.5–5 V, while its connector table differs; obtain the exact installed module specification.

Next isolate the ground connection while keeping battery power and converter VO+ on YRM100 VCC: with all power disconnected, connect reader GND directly to the same common ground point as ESP32 GND, then cold-boot with trigger released. If that restores reading, investigate the previous return path. If failure persists, measure rails during scanning and capture reader detection/RF-power acknowledgement logs. A further comparison can substitute a clean regulated reader supply within the exact module specification while keeping ESP32 power, UART, ground, tag position and cold-boot procedure fixed; do not tie competing positive supplies together. Merely reconnecting the ESP32's USB while its battery feeds VIN may introduce a board-specific backfeed path and is not a clean isolation test.

If this same scanner reads this same tag on USB but fails on battery, first investigate the battery power path and common ground. The strongest confirmed firmware contributor is that a failed startup reader check disables scanning indefinitely; there is no automatic reader recovery. A transient supply/startup problem can therefore become a persistent failure even after voltage stabilizes.

## Confirmed firmware findings

### 1. P1: Startup failure leaves scanning disabled until reset

Evidence: `firmware/rfid-scanner/rfid-scanner.ino:129`, `:135`, `:138`, `:68`, `:82`.

Startup queries reader information up to three times, then attempts RF-power configuration once. A missing information response or unsuccessful power acknowledgement sets `scannerReady=false`. Both scanning modes refuse to issue inventory commands when that flag is false. The normal loop never repeats initialization. Remote settings application also rejects an unavailable reader, so it cannot recover this state.

A missing acknowledgement is logged as the reader having rejected power, although it can also mean UART timeout, invalid frame, or loss of module power. Recommended change: expose distinct failure reasons and retry reader detection and power configuration with bounded backoff while idle. Gate scans during recovery and preserve queued events.

### 2. P1: A later UHF reset is not detected or reconfigured

Evidence: the reader calls throughout `rfid-scanner.ino`, and `src/yrm100.cpp:247` and `:271`.

Readiness represents successful startup commands, not continuing RF health. No periodic reader health query, RF-power readback, or recovery sequence exists. If only the UHF module resets, the ESP32 may keep reporting readiness while reader state has changed or communication has failed. A reset does not necessarily prevent inventory, but configured power is no longer verified. Reinitialize after confirmed communication failures; a legitimate no-tag response must not be treated as a reset.

### 3. P2: Error responses and transport failures become indistinguishable from no tags

Evidence: `src/yrm100.cpp:198`, `:241`, and the boolean-only `readFrame()` result.

Both scan paths discard the payload of a valid `type=0x01, cmd=0xFF` error response. Timeouts, bad checksums, incomplete frames, and ordinary no-tag results do not have separate counters or reported reasons. Consequently, `[SCAN] Captured 0 unique tag(s)` cannot establish that power, UART, or RF operation is healthy.

Recommended change: retain the last reader error byte and counts of valid notifications, error frames, timeouts and invalid frames; decode error meanings using the exact module protocol. Report the diagnostics without flooding the UART.

The compatible [Electron error-code reference](https://docs.electron.id/el-uhf-rmt01/frame-definition.html#response-error-codes) distinguishes `0x15` (no tag reply or tag CRC error), `0x20` (frequency-hopping channel search timeout), and `0x17` (invalid command). Losing those distinctions limits diagnosis. None of these alone proves battery undervoltage.

### 4. P2: Offline delivery capacity can stop inventory entirely

Evidence: `include/scan_queue.h`, `rfid-scanner.ino:68`, `:82`, `:95`, and `:176`.

The persistent queue holds 100 events. New scans are gated when it is full, storage is dirty, or the loaded queue is unhealthy. Battery use away from the saved network can fill the queue without delivering anything. At that point the firmware stops issuing scans by design. The message combines reader unavailability and queue fullness, which obscures the cause.

Recommended change: report reader state, queue count and storage state separately. Preserve pending events; do not clear NVS to diagnose this issue. Release the trigger and restore network access to allow delivery.

### 5. P2: Startup and synchronous networking can hide trigger presses

Evidence: `rfid-scanner.ino:113–129`, `:151–176`; `src/device_wifi_manager.cpp` and `src/api_client.cpp`.

The reader remains disabled while startup connects Wi-Fi (up to 15 seconds) and, after association, attempts clock synchronization (up to another 10 seconds). Button presses during that interval are not processed. Holding the trigger from boot invokes the eight-second setup gesture and suppresses that initial hold as a scan. During idle operation, synchronous HTTPS and clock synchronization can also delay input processing.

For the first comparison, boot with the trigger released, wait for startup to finish, then press again. Recommended change: initialize the reader independently of network startup and use cooperative network work. These waits explain an apparent unresponsive trigger; they do not establish a battery voltage fault.

## Checks that did not reveal a battery-specific code dependency

- There is no wait for a USB serial host and no USB/battery power-mode branch.
- GPIO26 enables the UHF module; GPIO16 receives module TXD; GPIO17 transmits to module RXD; GPIO27 is an active-low trigger. Common ground and UHF VCC remain physical wiring requirements.
- Scanning is permitted without Wi-Fi as long as reader readiness and queue/storage gates pass.
- The information query includes selector `0x00`. RF power is encoded as dBm multiplied by 100, with a matching successful acknowledgement. These agree with the compatible [Electron protocol examples](https://docs.electron.id/el-uhf-rmt01/frame-examples.html); compatibility with the physical variant still requires verification.
- The driver waits 200 ms after enable. The supplier-authored YRM100 document below lists startup under 100 ms for its module family. There is no evidence that a longer delay alone fixes this scanner; battery rail ramp and startup behavior must be measured.

## Hardware hypotheses, in diagnostic order

1. **UHF VCC is absent or outside its operating range on battery.** Check the supply at the module pins, not just the battery or ESP32 power LED. A board's USB-fed 5 V pin may behave differently when its ESP32 is powered through another input; verify the exact board schematic. Powering the ESP32 does not automatically power the reader.
2. **The supply sags or has excessive ripple during RF inventory.** A converter, battery protection circuit, switch, connector or thin cable can limit current. ESP32 Wi-Fi activity remains possible during scanning even though application HTTPS requests are deferred. Use an oscilloscope or fast capture; a multimeter can miss short dips.
3. **USB completes a missing ground path.** ESP32 ground, converter ground and UHF ground must share a dependable return path when all USB cables are removed. Verify EN at the UHF pin relative to that ground.
4. **Converter interference degrades reception.** If rails, ground, UART and startup checks pass, compare against a clean regulated supply with the same tag orientation and distance. Converter proximity/ripple is a hypothesis until this comparison demonstrates it.
5. **Battery use changes network availability or trigger timing.** Apply the queue/startup checks above before treating missing dashboard events as missing RF reads.

The [supplier-authored YRM100 technical PDF](https://manuals.plus/m/6a5c0ad2099ccefc9d5c41a70ec4ccba7237a1e0f5262f86d342f5cdb7f7c4e4.pdf), hosted by Manuals+, lists a 3.5–5 V operating range, 180 mA at 3.5 V/26 dBm, peak pulse current below 260 mA, 3.3 V UART levels and active-high EN. Its connector table also gives a broader 3–5 V figure. This inconsistency and module variants mean the exact purchased reader datasheet must govern wiring; the UART logic voltage must not be confused with VCC. The PDF is reference evidence, not proof of the installed module's specification.

[Espressif's ESP32 design guidelines](https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32/schematic-checklist.html) recommend a 3.3 V supply with at least 500 mA capability for the ESP32 and local decoupling. That rating covers the ESP32 design recommendation, not the complete ESP32-plus-UHF assembly. Size the actual converter for both loads and transients at the lowest battery voltage, using its output rating and efficiency rather than its switch-current label. Follow the exact development board's input requirements.

## Battery-only test procedure

1. Record battery configuration, converter part number/output setting, ESP32 board model, UHF variant, antenna and complete VCC/GND/EN/TX/RX wiring. Record the installed firmware version; repository source does not prove what is flashed.
2. Boot with the trigger released. Capture UART0 output at 115200 baud while keeping the scanner powered exclusively by battery. A suitable 3.3 V USB-to-UART adapter can listen to ESP32 TX0/GPIO1 and GND with its VCC and TX leads disconnected. Verify that the logging setup does not supply or backfeed the scanner; attaching the ESP32's normal USB cable can invalidate the comparison.
3. Capture `[RFID]` startup logs. Run `d` after startup to check version, mode and readiness. With the trigger released, `s` performs a diagnostic single scan and helps separate trigger wiring from reader operation.
4. Use the same known-good tag, distance and orientation for USB and battery tests. Confirm whether a local `[SCAN] ... captured` result occurs before interpreting the dashboard. Inventory delivery is deferred until trigger release.
5. Measure UHF VCC-to-UHF GND and ESP32 3.3 V at boot, idle and during trigger-held inventory. Capture minimum voltage/ripple; check UHF EN simultaneously if possible. Compare with the exact component operating ranges.
6. If the reader starts successfully, compare close-range scans at 18 and 20 dBm where supported and permitted. Improvement at lower power supports a load-related hypothesis, but reduced read range and changed RF conditions prevent it being conclusive. Keep the same tag position and obtain voltage traces.
7. Repeat across battery charge levels. If voltage rails remain valid, test a clean independent reader supply with common ground and no competing power feeds. Improvement isolates the reader power path or converter interference; failure directs investigation to UART, reader state, antenna and tag conditions.

| Observation | Interpretation / next check |
| --- | --- |
| ESP32 repeatedly reboots or reports brownout | Investigate ESP32 rail and common power path under load. |
| No valid reader information response | Check UHF VCC, EN, ground, UART, baud and startup timing. |
| Reader detected, RF-power acknowledgement fails | Capture command response and rails; current log does not prove rejection. |
| Reader ready, every scan returns zero | Capture UHF error bytes and supply during RF activity; check tag/antenna. |
| Reader unavailable or delivery queue full | Separate readiness from queue/storage gating. |
| Local capture succeeds but dashboard stays empty | Investigate release, Wi-Fi, TLS/authentication and delivery. |
| USB works; battery fails; UHF VCC dips during inventory | Strong evidence for the battery power path. |

## Recommended implementation order

First establish the physical power path with logs and voltage traces. Then add separate reader/queue diagnostics, preserve UHF error codes, and implement bounded idle reader recovery with RF-power acknowledgement/readback. Finally remove blocking network startup/input handling. Do not disable brownout detection or use repeated resets to conceal an inadequate supply.

## Verification

Source paths and control flow were inspected, and command formats were compared with compatible vendor documentation. Arduino CLI compilation passed for `esp32:esp32:esp32`: 1,108,676 bytes of program storage (84%) and 49,240 bytes of global RAM (15%). Generated build artifacts are under the ignored firmware build directory. Build success cannot validate battery power, tag performance, wiring, or the currently installed binary.
