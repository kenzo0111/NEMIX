#include "../include/provisioning_portal.h"
#include <WiFi.h>

ProvisioningPortal::ProvisioningPortal(ConfigManager& m, DeviceConfiguration& c)
    : _manager(m), _config(c), _server(80), _active(false), _startedAt(0), _failedAttempts(0) {}

static String htmlEscape(String value) {
    value.replace("&", "&amp;");
    value.replace("<", "&lt;");
    value.replace(">", "&gt;");
    value.replace("\"", "&quot;");
    value.replace("'", "&#39;");
    return value;
}

static bool isPrintableAscii(const String& s) {
    for (size_t i = 0; i < s.length(); ++i) {
        char c = s[i];
        if (c < 32 || c > 126) return false;
    }
    return true;
}

static bool isValidIdentifier(const String& s) {
    if (s.length() < 1 || s.length() > 64) return false;
    for (size_t i = 0; i < s.length(); ++i) {
        char c = s[i];
        if (!isalnum(c) && c != '-' && c != '_') return false;
    }
    return true;
}

static bool isValidServerUrl(const String& url) {
    if (url.length() < 8 || url.length() > 255) return false;
    if (!url.startsWith("https://")) return false; // Strictly enforce HTTPS
    for (size_t i = 0; i < url.length(); ++i) {
        char c = url[i];
        if (c < 33 || c > 126) return false; // No control characters or whitespace
    }
    return true;
}

String ProvisioningPortal::page() const {
    String options;
    int count = WiFi.scanNetworks();
    for (int i = 0; i < count; ++i) {
        options += "<option>" + htmlEscape(WiFi.SSID(i)) + "</option>";
    }

    String h = "<!doctype html><meta name=viewport content='width=device-width'><title>RFID Setup</title>";
    h += "<style>body{font:16px system-ui;max-width:520px;margin:30px auto;padding:20px;color:#172033;background:#f8fafc}";
    h += "input,button{box-sizing:border-box;width:100%;padding:12px;margin:6px 0 16px;border:1px solid #ccd3dd;border-radius:8px}";
    h += "button{background:#741b2b;color:white;border:0;font-weight:600;cursor:pointer}</style>";
    h += "<h2>RFID Scanner Setup</h2><p>Device: " + htmlEscape(_config.deviceId) + "</p>";
    h += "<p style='color:#64748b;font-size:14px'>Portal automatically closes after 5 minutes of inactivity.</p>";
    h += "<form method=post action=/save>";
    h += "<label>Wi-Fi SSID</label><input name=ssid list=n value='" + htmlEscape(_config.wifiSsid) + "' required maxlength=32>";
    h += "<datalist id=n>" + options + "</datalist>";
    h += "<label>Wi-Fi Password</label><input type=password name=password maxlength=63 placeholder='Leave blank to keep current password'>";
    h += "<label>Laravel Server URL (HTTPS only)</label><input name=url value='" + htmlEscape(_config.serverUrl) + "' required maxlength=255 placeholder='https://nemix.example.com'>";
    h += "<label>Device ID</label><input name=device_id value='" + htmlEscape(_config.deviceId) + "' required maxlength=64>";
    h += "<label>Device Token / Secret</label><input type=password name=token maxlength=128 placeholder='Leave blank to keep current token'>";
    h += "<button>Save and connect</button></form>";
    return h;
}

void ProvisioningPortal::begin() {
    if (_active) return;
    _startedAt = millis();
    _failedAttempts = 0;

    WiFi.mode(WIFI_AP_STA);
    String suffix = _config.deviceId.length() >= 3
        ? _config.deviceId.substring(_config.deviceId.length() - 3)
        : "NEW";
    String apSsid = "RFID-SETUP-" + suffix;
    String setupPin = ConfigManager::getOrGenerateSetupPin();

    // Secure SoftAP with WPA2 setup PIN (at least 8 characters)
    WiFi.softAP(apSsid.c_str(), setupPin.c_str());

    Serial.printf("[PORTAL] SoftAP started: SSID='%s' (WPA2 PIN protected, 5-min inactivity timeout).\n", apSsid.c_str());

    _server.on("/", HTTP_GET, [this]() {
        _server.send(200, "text/html", page());
    });

    _server.on("/save", HTTP_POST, [this]() {
        if (_failedAttempts >= 5) {
            _server.send(429, "text/plain", "Too many failed attempts. Setup locked.");
            return;
        }

        String ssid = _server.arg("ssid");
        String pass = _server.arg("password");
        String url = _server.arg("url");
        String devId = _server.arg("device_id");
        String token = _server.arg("token");

        // Validate SSID: 1-32 printable ASCII chars
        if (ssid.length() == 0 || ssid.length() > 32 || !isPrintableAscii(ssid)) {
            _failedAttempts++;
            _server.send(400, "text/plain", "Invalid Wi-Fi SSID (1-32 printable ASCII characters required)");
            return;
        }

        // Validate Password: empty or 8-63 printable ASCII chars
        if (pass.length() > 0 && (pass.length() < 8 || pass.length() > 63 || !isPrintableAscii(pass))) {
            _failedAttempts++;
            _server.send(400, "text/plain", "Invalid Wi-Fi password (must be 8-63 printable characters)");
            return;
        }

        // Validate Server URL: must strictly start with https://
        if (!isValidServerUrl(url)) {
            _failedAttempts++;
            _server.send(400, "text/plain", "Invalid server URL (must begin with https:// and contain no whitespace)");
            return;
        }

        // Validate Device ID: 1-64 alphanumeric + hyphen/underscore
        if (!isValidIdentifier(devId)) {
            _failedAttempts++;
            _server.send(400, "text/plain", "Invalid Device ID (1-64 alphanumeric, hyphen, or underscore characters)");
            return;
        }

        // Validate Token: empty or >= 16 printable characters
        if (token.length() > 0 && (token.length() < 16 || token.length() > 128 || !isPrintableAscii(token))) {
            _failedAttempts++;
            _server.send(400, "text/plain", "Invalid Device Token (minimum 16 characters required)");
            return;
        }

        DeviceConfiguration next = _config;
        next.wifiSsid = ssid;
        if (pass.length() > 0) next.wifiPassword = pass;
        next.serverUrl = url;
        next.deviceId = devId;
        if (token.length() > 0) next.deviceToken = token;

        if (!_manager.validateConfiguration(next, true)) {
            _failedAttempts++;
            _server.send(422, "text/plain", "Configuration failed validation rules");
            return;
        }

        _manager.savePendingConfiguration(next);
        _server.send(200, "text/html", "<h2>Saved</h2><p>Credentials stored securely. SoftAP disabled. Rebooting...</p>");

        // Never log secrets/passwords to serial output
        Serial.println(F("[PORTAL] Configuration saved. Disabling SoftAP and rebooting..."));

        delay(300);
        stop();
        delay(300);
        ESP.restart();
    });

    _server.begin();
    _active = true;
}

void ProvisioningPortal::loop() {
    if (!_active) return;

    // Inactivity timeout: automatically shut down SoftAP after 5 minutes
    if (millis() - _startedAt >= PORTAL_TIMEOUT_MS) {
        Serial.println(F("[PORTAL] Inactivity timeout (5 minutes) elapsed. Shutting down SoftAP."));
        stop();
        return;
    }

    _server.handleClient();
}

void ProvisioningPortal::stop() {
    if (!_active) return;
    _server.stop();
    WiFi.softAPdisconnect(true);
    WiFi.mode(WIFI_STA);
    _active = false;
    Serial.println(F("[PORTAL] SoftAP disabled."));
}
