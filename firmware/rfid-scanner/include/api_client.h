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
    void pollWifiScan();
    bool wifiScanReady() const { return _wifiNetworks.length() > 0; }
    ItemLookupResult submitScan(const String& epc, int rssi);
    bool sendHeartbeat(uint32_t uptimeSeconds, bool scannerReady, uint32_t& serverVersion, uint32_t networkVersion, const String& diagnostics);
    bool fetchConfiguration(DeviceConfiguration& candidate);
    bool fetchNetworkConfiguration(DeviceConfiguration& candidate, uint32_t currentVersion);
    bool reportConfigurationStatus(uint32_t version, const char* status, const String& message = "");
    bool verifyConnection(DeviceConfiguration& candidate);
    bool submitScans(const String& body, size_t expectedCount);

private:
    bool _wifiScanRunning = false;
    bool _wifiScanRequested = false;
    String _wifiScanRequestId;
    String _wifiNetworks;
    uint32_t _wifiScannedAt = 0;
    uint32_t _wifiScanAttemptAt = 0;
    String _baseUrl;
    String _deviceId;
    String _token;
    int request(const String& method, const String& path, const String& json, String& response);
};
