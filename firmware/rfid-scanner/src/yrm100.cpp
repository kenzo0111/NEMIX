#include "../include/yrm100.h"

static const uint8_t FRAME_HEADER = 0xBB;
static const uint8_t FRAME_END    = 0x7E;

Yrm100Reader::Yrm100Reader(HardwareSerial& serial, int8_t enPin, int8_t rxPin, int8_t txPin)
    : _serial(serial), _enPin(enPin), _rxPin(rxPin), _txPin(txPin), _baud(115200) {}

void Yrm100Reader::begin(uint32_t baudRate) {
    _baud = baudRate;
    if (_enPin >= 0) {
        pinMode(_enPin, OUTPUT);
        wake();
    }
    _serial.begin(_baud, SERIAL_8N1, _rxPin, _txPin);
    delay(200); // Oscillator stabilization
}

void Yrm100Reader::wake() {
    if (_enPin >= 0) {
        digitalWrite(_enPin, HIGH);
    }
}

void Yrm100Reader::sleep() {
    if (_enPin >= 0) {
        digitalWrite(_enPin, LOW);
    }
}

uint8_t Yrm100Reader::calculateChecksum(uint8_t type, uint8_t cmd, const uint8_t* payload, uint16_t len) {
    uint32_t sum = type + cmd + ((len >> 8) & 0xFF) + (len & 0xFF);
    for (uint16_t i = 0; i < len; i++) {
        sum += payload[i];
    }
    return static_cast<uint8_t>(sum & 0xFF);
}

String Yrm100Reader::bytesToHex(const uint8_t* data, size_t len) {
    String hex = "";
    hex.reserve(len * 2);
    char buf[3];
    for (size_t i = 0; i < len; i++) {
        sprintf(buf, "%02X", data[i]);
        hex += buf;
    }
    return hex;
}

void Yrm100Reader::sendFrame(uint8_t type, uint8_t cmd, const uint8_t* payload, uint16_t len) {
    // Flush RX buffer before sending
    while (_serial.available() > 0) {
        _serial.read();
    }

    uint8_t checksum = calculateChecksum(type, cmd, payload, len);
    uint8_t lenMsb = (len >> 8) & 0xFF;
    uint8_t lenLsb = len & 0xFF;

    _serial.write(FRAME_HEADER);
    _serial.write(type);
    _serial.write(cmd);
    _serial.write(lenMsb);
    _serial.write(lenLsb);
    if (len > 0 && payload != nullptr) {
        _serial.write(payload, len);
    }
    _serial.write(checksum);
    _serial.write(FRAME_END);
    _serial.flush();
}

bool Yrm100Reader::readFrame(uint8_t& outType, uint8_t& outCmd, std::vector<uint8_t>& outPayload, uint32_t timeoutMs) {
    outPayload.clear();
    unsigned long startTime = millis();

    // 1. Wait for Frame Header 0xBB
    bool headerFound = false;
    while ((millis() - startTime) < timeoutMs) {
        if (_serial.available() > 0) {
            uint8_t b = _serial.read();
            if (b == FRAME_HEADER) {
                headerFound = true;
                break;
            }
        }
        delay(1);
    }
    if (!headerFound) return false;

    // 2. Read Type, Cmd, Length (4 bytes)
    uint8_t meta[4];
    size_t metaRead = 0;
    while (metaRead < 4 && (millis() - startTime) < timeoutMs) {
        if (_serial.available() > 0) {
            meta[metaRead++] = _serial.read();
        } else {
            delay(1);
        }
    }
    if (metaRead < 4) return false;

    outType = meta[0];
    outCmd  = meta[1];
    uint16_t len = (static_cast<uint16_t>(meta[2]) << 8) | meta[3];

    // Sanity check length
    if (len > 256) return false;

    // 3. Read Payload
    if (len > 0) {
        outPayload.resize(len);
        size_t payloadRead = 0;
        while (payloadRead < len && (millis() - startTime) < timeoutMs) {
            if (_serial.available() > 0) {
                outPayload[payloadRead++] = _serial.read();
            } else {
                delay(1);
            }
        }
        if (payloadRead < len) return false;
    }

    // 4. Read Checksum & End Byte (2 bytes)
    uint8_t tail[2];
    size_t tailRead = 0;
    while (tailRead < 2 && (millis() - startTime) < timeoutMs) {
        if (_serial.available() > 0) {
            tail[tailRead++] = _serial.read();
        } else {
            delay(1);
        }
    }
    if (tailRead < 2) return false;

    uint8_t expectedChecksum = tail[0];
    uint8_t endByte = tail[1];

    if (endByte != FRAME_END) return false;

    uint8_t actualChecksum = calculateChecksum(outType, outCmd, outPayload.data(), len);
    return (actualChecksum == expectedChecksum);
}

std::vector<RfidTag> Yrm100Reader::scanTags(uint32_t timeoutMs) {
    std::vector<RfidTag> foundTags;

    // Send Single Poll command: BB 00 22 00 00 22 7E
    sendFrame(0x00, 0x22, nullptr, 0);

    unsigned long start = millis();
    while ((millis() - start) < timeoutMs) {
        uint8_t type = 0;
        uint8_t cmd  = 0;
        std::vector<uint8_t> payload;

        if (readFrame(type, cmd, payload, 80)) {
            // Check if tag notification frame
            if (cmd == 0x22 && type == 0x02 && payload.size() >= 7) {
                // Byte 0: RSSI
                int rssiRaw = payload[0];
                int rssiDbm = rssiRaw - 256; // Standard negative dBm approximation

                // Bytes 1-2: PC Word
                uint16_t pc = (static_cast<uint16_t>(payload[1]) << 8) | payload[2];

                // EPC length in words (bits 15..11 of PC)
                uint8_t epcWords = (pc >> 11) & 0x1F;
                uint8_t epcBytes = epcWords * 2;

                // Validate payload size bounds: 1 (RSSI) + 2 (PC) + epcBytes + 2 (CRC)
                if (epcBytes > 0 && (3 + epcBytes) <= payload.size()) {
                    String epcStr = bytesToHex(&payload[3], epcBytes);

                    // Deduplicate within this single scan
                    bool duplicate = false;
                    for (const auto& tag : foundTags) {
                        if (tag.epc == epcStr) {
                            duplicate = true;
                            break;
                        }
                    }

                    if (!duplicate) {
                        RfidTag tag;
                        tag.epc = epcStr;
                        tag.rssiRaw = rssiRaw;
                        tag.rssiDbm = rssiDbm;
                        tag.pc = pc;
                        foundTags.push_back(tag);
                    }
                }
            } else if (type == 0x01 && cmd == 0xFF) {
                // Fail response (e.g. no tag found / timeout)
                break;
            }
        }
    }

    return foundTags;
}

String Yrm100Reader::getVersion(uint32_t timeoutMs) {
    // Send Get Version: BB 00 03 00 00 03 7E
    sendFrame(0x00, 0x03, nullptr, 0);

    uint8_t type = 0;
    uint8_t cmd  = 0;
    std::vector<uint8_t> payload;

    if (readFrame(type, cmd, payload, timeoutMs)) {
        if (cmd == 0x03 && payload.size() > 0) {
            String ver = "";
            for (size_t i = 0; i < payload.size(); i++) {
                char c = static_cast<char>(payload[i]);
                if (isprint(c)) {
                    ver += c;
                }
            }
            return ver;
        }
    }
    return "Unknown";
}
