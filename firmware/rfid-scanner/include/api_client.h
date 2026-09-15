#pragma once

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include "config_manager.h"

struct ItemLookupResult {
    bool success;
    int httpCode;
    bool found;
    String rawJson;
};

class NemixApiClient {
public:
    NemixApiClient();
    void configure(const DeviceConfiguration& config);
    bool checkWifi();
    ItemLookupResult submitScan(const String& epc, int rssi);
    bool sendHeartbeat(uint32_t uptimeSeconds, bool scannerReady, uint32_t& serverVersion);
    bool fetchConfiguration(DeviceConfiguration& candidate);
    bool fetchNetworkConfiguration(DeviceConfiguration& candidate, uint32_t currentVersion);
    bool reportConfigurationStatus(uint32_t version, const char* status, const String& message = "");

private:
    String _baseUrl;
    String _deviceId;
    String _token;
    int request(const String& method, const String& path, const String& json, String& response);
    static String jsonString(const String& json, const char* key, const String& fallback = "");
    static long jsonLong(const String& json, const char* key, long fallback);
    static bool jsonBool(const String& json, const char* key, bool fallback);
};
