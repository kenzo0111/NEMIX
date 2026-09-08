#include "../include/api_client.h"
#include <WiFiClientSecure.h>

NemixApiClient::NemixApiClient(const char* baseUrl, const char* lookupPath, const char* token)
    : _baseUrl(baseUrl), _lookupPath(lookupPath), _token(token) {}

static bool connectToAp(const char* ssid, const char* password, int32_t channel = 0, const uint8_t* bssid = nullptr) {
    WiFi.persistent(false);
    WiFi.mode(WIFI_STA);
    WiFi.disconnect();
    delay(200);

    if (channel > 0 && bssid != nullptr) {
        Serial.printf("[WIFI] Direct 2.4GHz lock on Ch:%d (%02X:%02X:%02X:%02X:%02X:%02X)...\n",
                      channel, bssid[0], bssid[1], bssid[2], bssid[3], bssid[4], bssid[5]);
        WiFi.begin(ssid, password, channel, bssid);
    } else {
        Serial.printf("[WIFI] Standard connection to '%s'...\n", ssid);
        WiFi.begin(ssid, password);
    }

    Serial.print(F("[WIFI] Connecting"));
    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED && (millis() - start) < 14000) {
        delay(500);
        Serial.print('.');
    }
    Serial.println();

    return (WiFi.status() == WL_CONNECTED);
}

void NemixApiClient::beginWifi(const char* ssid, const char* password) {
    if (String(ssid) == "YOUR_WIFI_SSID" || strlen(ssid) == 0) {
        Serial.println(F("[WIFI] Wi-Fi credentials not configured. Running in offline mode."));
        return;
    }

    Serial.printf("[WIFI] Connecting to '%s'...\n", ssid);

    // 1. Direct lock on the router's 2.4GHz BSSID (bypasses 5GHz band-steering rejections)
    const uint8_t bssid_main[6] = {0x84, 0x3C, 0x99, 0x0F, 0x40, 0xFA};
    bool connected = connectToAp(ssid, password, 7, bssid_main);

    // 2. Fallback to Extender 2.4GHz BSSID if main router rejects
    if (!connected) {
        const uint8_t bssid_ext[6] = {0x86, 0x3C, 0x99, 0x1F, 0x40, 0xFA};
        Serial.println(F("[WIFI] Attempting direct lock on extender (2.4GHz)..."));
        connected = connectToAp("PLDTHOMEFIBR46PRK_EXT", password, 7, bssid_ext);
    }

    // 3. General standard scan fallback
    if (!connected) {
        Serial.println(F("[WIFI] Attempting general connection..."));
        connected = connectToAp(ssid, password, 0, nullptr);
    }

    if (connected) {
        Serial.printf("[WIFI] Connected! IP: %s | RSSI: %d dBm | Gateway: %s\n",
                      WiFi.localIP().toString().c_str(),
                      WiFi.RSSI(),
                      WiFi.gatewayIP().toString().c_str());
    } else {
        Serial.printf("[WIFI] Connection timed out (Status: %d). Continuing in offline serial mode.\n",
                      WiFi.status());
    }
}

bool NemixApiClient::checkWifi() {
    return (WiFi.status() == WL_CONNECTED);
}

ItemLookupResult NemixApiClient::lookupTag(const String& epc) {
    ItemLookupResult result;
    result.success = false;
    result.httpCode = 0;
    result.found = false;
    result.rawJson = "";

    if (WiFi.status() != WL_CONNECTED) {
        Serial.println(F("[API] Wi-Fi not connected. Skipping API lookup."));
        return result;
    }

    String url = _baseUrl + _lookupPath + epc;
    Serial.printf("[API] GET Request -> %s\n", url.c_str());

    HTTPClient http;
    bool beginOk = false;

    if (url.startsWith("https://")) {
        WiFiClientSecure client;
        client.setInsecure(); // Allow Cloudflare / Let's Encrypt SSL
        beginOk = http.begin(client, url);
        if (beginOk) {
            processRequest(http, result);
        }
    } else {
        beginOk = http.begin(url);
        if (beginOk) {
            processRequest(http, result);
        }
    }

    if (!beginOk) {
        Serial.println(F("[API] Failed to initialize HTTP client connection."));
    }

    return result;
}

void NemixApiClient::processRequest(HTTPClient& http, ItemLookupResult& result) {
    http.addHeader("Accept", "application/json");
    if (_token.length() > 0) {
        http.addHeader("Authorization", "Bearer " + _token);
    }
    http.setTimeout(8000);

    int httpCode = http.GET();
    result.httpCode = httpCode;

    if (httpCode > 0) {
        result.success = true;
        result.rawJson = http.getString();
        result.found = (httpCode == 200);

        Serial.printf("[API] HTTP Response Code: %d\n", httpCode);
        if (httpCode == 200) {
            Serial.printf("[API] Matched Item Data: %s\n", result.rawJson.c_str());
        } else if (httpCode == 302) {
            Serial.println(F("[API] Note: Route redirected to /login (Protected by auth middleware)."));
        } else {
            Serial.printf("[API] Response: %s\n", result.rawJson.c_str());
        }
    } else {
        Serial.printf("[API] Request failed, error: %s\n", http.errorToString(httpCode).c_str());
    }

    http.end();
}
