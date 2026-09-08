#pragma once

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>

struct ItemLookupResult {
    bool success;
    int httpCode;
    bool found;
    String rawJson;
};

class NemixApiClient {
public:
    NemixApiClient(const char* baseUrl, const char* lookupPath, const char* token = "");

    void beginWifi(const char* ssid, const char* password);
    bool checkWifi();

    // Query Laravel's /rfid-scanner/lookup/{tag} endpoint
    ItemLookupResult lookupTag(const String& epc);

private:
    String _baseUrl;
    String _lookupPath;
    String _token;

    void processRequest(HTTPClient& http, ItemLookupResult& result);
};
