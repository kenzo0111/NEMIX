# Security Remediation Summary

This report describes changes in the local checkout. It does not assert that the production server, firewall, Cloudflare configuration, or deployed scanners have already changed.

| ID | Vulnerability | Original Severity | Status |
| --- | --- | ---: | --- |
| SEC-001 | Public pgAdmin | Critical | Partial |
| SEC-002 | RFID UA authentication bypass | Critical | Fixed |
| SEC-003 | RFID broken RBAC | High | Fixed |
| SEC-004 | GET authorization bypass | High | Fixed |
| SEC-005 | Wi-Fi credential exposure | High | Fixed |
| SEC-006 | RFID replay/spoofing | High | Partial |
| SEC-007 | Wildcard trusted proxy | Medium | Partial |
| SEC-008 | Origin exposure | Medium | Partial |
| SEC-009 | Reversible password storage | Medium | Fixed |
| SEC-010 | DomPDF remote resources | Medium | Fixed |
| SEC-011 | Audit log exposure | Medium | Fixed |
| SEC-012 | Migration DoS | Medium | Fixed |
| SEC-013 | OTP rate limit | Medium | Fixed |
| SEC-014 | Vulnerable dependencies | High | Partial |
| SEC-015 | Security headers | Low | Partial |
| SEC-016 | SMTP diagnostic scripts | Low | Fixed |
| SEC-017 | RFID HTTP downgrade | Medium | Fixed |

## Remediation details

### SEC-001 — Public pgAdmin

- **Files modified:** `docker-compose.yml`, `DEPLOYMENT_CHEATSHEET.md`, `.env.example`, `database/seeders/DatabaseSeeder.php`.
- **Previous behavior:** pgAdmin bound to every host interface, with documented default credentials; Docker supplied fallback database credentials. Seeder created accounts with known passwords.
- **Secure implementation:** PostgreSQL has no host port; pgAdmin is an optional profile bound to `127.0.0.1:5050`. Default database credentials and seeded account passwords were removed. Administration uses SSH tunneling and environment-provided unique credentials.
- **Tests:** `docker compose config --quiet` passed. Static port mapping and credential review performed.
- **Verification result:** Local Compose configuration no longer publishes ports 5050 or 5432. External reachability and rotation of previously committed credentials require production deployment and verification. Rotate any accounts or services that used old defaults; Git history retains previously committed material.

### SEC-002 — RFID User-Agent bypass

- **Files modified:** `app/Http/Middleware/AuthenticateRfidHardware.php`, `config/services.php`, `phpunit.xml`, `tests/Feature/Inventory/RfidScannerTest.php`, `tests/Feature/IsoIec25010DefectFixesTest.php`, `tests/Feature/RfidHmacSecurityTest.php`.
- **Previous behavior:** an ESP32 User-Agent or absent configured token could permit legacy web RFID requests.
- **Secure implementation:** legacy lookup and polling endpoints require an authenticated web session; hardware uses the registered-device API. The universal token configuration was removed.
- **Tests:** User-Agent-only and legacy bearer-token requests are rejected.
- **Verification result:** these bypasses return 401 in automated tests.

### SEC-003 — RFID RBAC

- **Files modified:** `app/Http/Controllers/Inventory/RfidScannerController.php`, `app/Http/Middleware/AuthorizeAction.php`, `app/Policies/ResourceOwnershipPolicy.php`, `tests/Feature/Inventory/RfidScannerTest.php`.
- **Previous behavior:** contradictory permission checks let users without an RFID permission proceed.
- **Secure implementation:** server-side checks independently require view, assign, replace, or unassign authority; ownership and row locking remain in place. Both existing administrator role names are honored.
- **Tests:** unauthorized staff is denied; staff with assign permission can assign; staff without unassign permission is denied.
- **Verification result:** covered state changes return 403 without the required permission.

### SEC-004 — GET authorization bypass

- **Files modified:** `app/Http/Middleware/AuthorizeAction.php`, `routes/web.php`, `Modules/AuditLogs/routes/api.php`, `Modules/Inventory/routes/api.php`, `Modules/Suppliers/routes/api.php`, `Modules/UserManagement/routes/api.php`, `tests/Feature/Inventory/RfidScannerTest.php`.
- **Previous behavior:** every GET/HEAD web request bypassed route permission checks.
- **Secure implementation:** named read routes are checked like writes; dashboard and account profile retain intended session access. The previously unnamed PDF GET route was named. Module API routes use the same authorization middleware after Sanctum authentication.
- **Tests:** low privilege requests to reports, audit logs, and system settings return 403. Route table review found `/` as the only unnamed web GET route.
- **Verification result:** manual URL access to the tested protected reads is blocked.

### SEC-005 — Wi-Fi credentials

- **Files modified:** `app/Http/Controllers/Hardware/RfidDeviceController.php`, `app/Http/Requests/Admin/UpdateRfidDeviceRequest.php`, `tests/Feature/RfidDeviceConfigurationTest.php`.
- **Previous behavior:** credential distribution relied on a reusable device token and did not explicitly disable response caching. The model already used Laravel's encrypted cast.
- **Secure implementation:** configuration requests require HMAC authentication, HTTPS server URLs, no-store responses, and distribution audit events. Wi-Fi passwords remain hidden from web serialization and encrypted at rest.
- **Tests:** encrypted database value, authorized retrieval, absence from ordinary configuration, and no-store response are checked.
- **Verification result:** only a signed registered device receives its version-gated network configuration in tests.

### SEC-006 — RFID replay/spoofing

- **Files modified:** `app/Http/Middleware/AuthenticateRfidDevice.php`, `app/Models/RfidDevice.php`, `database/migrations/2026_09_17_000001_add_rfid_device_secret.php`, `app/Http/Controllers/Admin/RfidDeviceSettingController.php`, `routes/web.php`, `resources/js/Pages/Admin/SystemSettings/Components/RfidSettings.tsx`, `firmware/rfid-scanner/src/api_client.cpp`, `firmware/rfid-scanner/README.md`, `tests/Feature/RfidHmacSecurityTest.php`, `tests/Feature/RfidDeviceConfigurationTest.php`.
- **Previous behavior:** a reusable device token authenticated all requests from a scanner; replayed requests remained valid.
- **Secure implementation:** unique per-device encrypted signing secrets, timestamp/body/method/path HMAC, constant-time comparison, two-minute nonce cache, disabled-device rejection, one-time provisioning display, rotation, disable and revoke controls, and security audit events. Existing hash-only devices fail closed until rotated and reprovisioned.
- **Tests:** unsigned, invalid, expired, replayed, and disabled requests fail; a valid signed request succeeds. ESP32 firmware compiled with the installed core.
- **Verification result:** local tests block replay and impersonation without the secret. Production needs the migration, a shared cache, deployment, scanner firmware update, and per-device rotation/reprovisioning.

### SEC-007 — Wildcard trusted proxy

- **Files modified:** `bootstrap/app.php`, `config/app.php`, `app/Http/Middleware/EnforceHttpsAndSecurityHeaders.php`, `.env.example`, `DEPLOYMENT_CHEATSHEET.md`, `ops/sync_cloudflare_proxies.py`.
- **Previous behavior:** every source was trusted as a proxy and a raw forwarded-protocol header could suppress HTTPS enforcement.
- **Secure implementation:** only operator-supplied `TRUSTED_PROXIES` are trusted; HTTPS decisions use Laravel's trusted request metadata.
- **Tests:** PHP suite passed; proxy configuration and rate-limit behavior require an origin and Cloudflare integration check.
- **Verification result:** wildcard trust is removed in code. Production must set the actual direct proxy addresses and verify ingress.

### SEC-008 — Origin exposure

- **Files modified:** `DEPLOYMENT_CHEATSHEET.md`, `docker-compose.yml`.
- **Previous behavior:** documentation instructed public pgAdmin access and did not provide a safe firewall rollout.
- **Secure implementation:** documented staged SSH and Cloudflare ingress rules; DB and pgAdmin host ports are not publicly mapped by Compose.
- **Tests:** local Compose validation passed.
- **Verification result:** firewall rules were not changed or externally tested. Apply them on DigitalOcean with a recovery console and verify externally.

### SEC-009 — Reversible password storage

- **Files modified:** `app/Http/Controllers/Auth/PasswordChangeOtpController.php`, `app/Http/Controllers/Auth/PasswordController.php`, `app/Models/PasswordChangeRequest.php`, `database/migrations/2026_09_17_000002_remove_pending_password.php`, `resources/js/Pages/Profile/hooks/usePasswordOtpFlow.ts`, `tests/Feature/Auth/PasswordChangeOtpTest.php`, `tests/Feature/Auth/PasswordUpdateTest.php`, `tests/Feature/ProfileTest.php`.
- **Previous behavior:** the requested new password was encrypted and stored until OTP verification.
- **Secure implementation:** only an OTP hash is stored. The new password is supplied with OTP verification, hashed, and the request atomically claimed and deleted. Legacy pending requests are invalidated and the recoverable-password column is removed. Both password update routes enforce OTP attempts and single use.
- **Tests:** request, invalid attempts, expiry, replacement, one-time use, and successful password update passed.
- **Verification result:** a future password is no longer stored reversibly.

### SEC-010 — DomPDF remote resources

- **Files modified:** `app/Http/Controllers/Compliance/CompliancePdfController.php`.
- **Previous behavior:** report renderers enabled remote resource loading.
- **Secure implementation:** all five PDF render paths disable it. Existing raw Blade descriptions use escaped content before line-break markup.
- **Tests:** PDF and full application suite passed.
- **Verification result:** report rendering cannot fetch remote assets through DomPDF settings.

### SEC-011 — Audit log exposure

- **Files modified:** `Modules/AuditLogs/app/Http/Controllers/AuditLogsController.php`, `app/Policies/ResourceOwnershipPolicy.php`, `app/Http/Middleware/AuthorizeAction.php`, `tests/Feature/Inventory/RfidScannerTest.php`.
- **Previous behavior:** ownerless login and transaction events were included in ordinary users' scoped queries.
- **Secure implementation:** global audit pages require an administrator or explicit global-audit permission. Ownerless resources are not implicitly owned by every user.
- **Tests:** low privilege user denied the login-trail page; full audit suite passed.
- **Verification result:** tested global audit access returns 403.

### SEC-012 — Migration DoS

- **Files modified:** `app/Http/Controllers/Compliance/ComplianceMigrationController.php`, `resources/js/Pages/Compliance/Reports/hooks/useHistoricalMigration.ts`, `tests/Feature/ComplianceMigrationTest.php`.
- **Previous behavior:** migration accepted unbounded record arrays and weak nested input validation.
- **Secure implementation:** server accepts at most 500 records and validates record shape, common fields, lengths, and numeric boundaries. Browser import limits file size and batch count.
- **Tests:** oversized and malformed batches are rejected before a migration log is created.
- **Verification result:** tested oversized and malformed payloads return validation errors. Client-side MIME checks alone cannot establish file authenticity; raw uploads are parsed in the browser and the server receives JSON records.

### SEC-013 — OTP throttling

- **Files modified:** `routes/auth.php`, `app/Http/Controllers/Auth/PasswordController.php`, `app/Http/Controllers/Auth/PasswordChangeOtpController.php`, related authentication tests.
- **Previous behavior:** OTP routes allowed 30 requests per minute, and the alternate password route did not increment failed OTP attempts.
- **Secure implementation:** OTP request, verify, and resend routes are limited to five per minute per source IP, with controller limits per account and OTP request. The alternate route now counts failures.
- **Tests:** maximum attempts, expiration, replacement, and single use passed.
- **Verification result:** brute-force paths are throttled; production proxy trust must be configured to preserve correct client IP attribution.

### SEC-014 — Dependencies

- **Files modified:** none.
- **Previous behavior:** dependency advisories had not been verified as part of this remediation.
- **Secure implementation:** no blind dependency upgrades were made; spreadsheet parsing consumers were located before any possible replacement.
- **Tests:** `npm audit --json` reported zero advisories. `composer audit` could not fetch Packagist advisories because this host rejected the certificate chain; TLS verification was not disabled.
- **Verification result:** Composer dependency status remains unverified. Rerun `composer audit` after repairing the host trust chain.

### SEC-015 — Security headers

- **Files modified:** `app/Http/Middleware/EnforceHttpsAndSecurityHeaders.php`.
- **Previous behavior:** CSP allowed `unsafe-eval`; permissions and opener policy headers were absent.
- **Secure implementation:** removed `unsafe-eval`, added Permissions-Policy and Cross-Origin-Opener-Policy. Existing HSTS, nosniff, and referrer policy remain. `unsafe-inline` remains for existing frontend compatibility; CORP was not forced globally because PDF and asset workflows need a separate compatibility check.
- **Tests:** frontend production build and PHP suite passed.
- **Verification result:** removed eval permission in application CSP; stricter nonce-based CSP remains future work.

### SEC-016 — SMTP diagnostics

- **Files modified:** deleted `check-mail-config.php` and `check-smtp-conn.php`; adjusted exception logging in `bootstrap/app.php`, `app/Http/Middleware/SecurityAuditLogger.php`, and password controllers.
- **Previous behavior:** repository-root scripts could reveal mail configuration if served.
- **Secure implementation:** scripts removed; security logs no longer include raw request parameters, URLs with possible reset tokens, or exception text that may contain secrets.
- **Tests:** full PHP suite passed; file search found no remaining references to the scripts.
- **Verification result:** those diagnostic entry points are absent from the checkout.

### SEC-017 — Firmware HTTP downgrade

- **Files modified:** `firmware/rfid-scanner/src/api_client.cpp`, `firmware/rfid-scanner/src/config_manager.cpp`, `firmware/rfid-scanner/README.md`, `app/Http/Requests/Admin/UpdateRfidDeviceRequest.php`, `app/Http/Controllers/Admin/RfidDeviceSettingController.php`.
- **Previous behavior:** firmware accepted and transmitted over HTTP when configured with an HTTP URL.
- **Secure implementation:** configuration rejects non-HTTPS URLs; the API client refuses non-HTTPS requests and retains certificate verification. NTP time is required before signing.
- **Tests:** ESP32 build succeeded using `arduino-cli compile --fqbn esp32:esp32:esp32`.
- **Verification result:** source and compiled firmware have no HTTP API fallback. Physical scanner and production TLS integration remain to be tested after flashing.

## Other review results

- Existing inventory issuance and receiving services retain transactions and `lockForUpdate`; the RFID tag column already has a unique constraint. No concurrency controls were removed. A real multi-process PostgreSQL concurrency test was not performed locally.
- Hardware API routes remain stateless; web writes retain CSRF middleware. Module Sanctum API routes now also have route authorization.
- The repository's `.env` is ignored and not tracked. Previously committed seeded account credentials and documented defaults should be treated as compromised and rotated in production.
- A pre-existing untracked `storage/routes.json` file was not changed.

## Verification commands

| Command | Result |
| --- | --- |
| `php artisan test --compact` | 306 tests passed, 1,856 assertions |
| `npm run build -- --logLevel error` | Passed |
| `npm audit --json` | Zero reported advisories |
| `composer audit --format=json` | Blocked by local TLS trust failure |
| `docker compose config --quiet` | Passed |
| `arduino-cli compile --fqbn esp32:esp32:esp32` | Passed |
| `php artisan route:list --json` | Reviewed web, hardware, compliance, audit, admin, and module API routes |

## Production rollout required

1. Back up the database and deploy the migrations with the application and frontend build. The OTP migration invalidates existing pending requests and removes their recoverable-password field; users can request a new OTP.
2. Rotate old seeded account, database, pgAdmin, and scanner credentials. Provision a unique new signing secret to each scanner and flash the HTTPS/HMAC firmware. Existing hash-only devices remain rejected until reprovisioned.
3. Set `TRUSTED_PROXIES` and a shared replay cache, then verify real client IPs and HTTPS behavior through Cloudflare and on direct origin connections.
4. Apply firewall changes in the documented order, preserving verified SSH access, then confirm ports 5050 and 5432 are closed externally and Laravel still connects internally.
5. Repair the host TLS certificate trust chain and rerun `composer audit`; test actual scanner provisioning, signed scanning, and Wi-Fi migration on hardware.
