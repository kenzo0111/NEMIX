#pragma once

#include <Arduino.h>
#include <vector>

struct RfidTag {
    String epc;       // Hex string, e.g. "E2843611000010000FD08ED7"
    int rssiRaw;      // Raw RSSI byte from reader
    int rssiDbm;      // Estimated RSSI in dBm
    uint16_t pc;      // Protocol Control word
};

class Yrm100Reader {
public:
    Yrm100Reader(HardwareSerial& serial, int8_t enPin, int8_t rxPin, int8_t txPin);

    void begin(uint32_t baudRate = 115200);
    void wake();
    void sleep();

    // Trigger single inventory poll and parse all detected tags within window
    std::vector<RfidTag> scanTags(uint32_t timeoutMs = 350);

    // Query reader version string
    String getVersion(uint32_t timeoutMs = 300);

private:
    HardwareSerial& _serial;
    int8_t _enPin;
    int8_t _rxPin;
    int8_t _txPin;
    uint32_t _baud;

    void sendFrame(uint8_t type, uint8_t cmd, const uint8_t* payload, uint16_t len);
    bool readFrame(uint8_t& outType, uint8_t& outCmd, std::vector<uint8_t>& outPayload, uint32_t timeoutMs);
    static uint8_t calculateChecksum(uint8_t type, uint8_t cmd, const uint8_t* payload, uint16_t len);
    static String bytesToHex(const uint8_t* data, size_t len);
};
