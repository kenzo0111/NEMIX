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

    // Repeat inventory rounds within the window; optionally stop at the first EPC.
    std::vector<RfidTag> scanTags(uint32_t timeoutMs = 350, bool stopAfterFirst = false, size_t maxTags = 100);

    // Cooperative single-poll rounds; returns immediately when no UART data is available.
    bool pollHeldTag(RfidTag& tag);
    void cancelHeldPoll();

    // Query reader version string
    String getVersion(uint32_t timeoutMs = 300);
    bool setTransmitPower(uint8_t dbm, uint32_t timeoutMs = 300);

private:
    HardwareSerial& _serial;
    int8_t _enPin;
    int8_t _rxPin;
    int8_t _txPin;
    uint32_t _baud;
    bool _heldPolling=false;
    uint32_t _heldStarted=0;
    std::vector<uint8_t> _heldFrame;

    void sendFrame(uint8_t type, uint8_t cmd, const uint8_t* payload, uint16_t len);
    bool readFrame(uint8_t& outType, uint8_t& outCmd, std::vector<uint8_t>& outPayload, uint32_t timeoutMs);
    static uint8_t calculateChecksum(uint8_t type, uint8_t cmd, const uint8_t* payload, uint16_t len);
    static String bytesToHex(const uint8_t* data, size_t len);
};
