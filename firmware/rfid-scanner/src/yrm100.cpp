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

void Yrm100Reader::restart() {
    cancelHeldPoll();
    sleep(); delay(100); wake(); delay(500);
    while(_serial.available()>0) _serial.read();
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
    if (!headerFound) { _health.failure(true); return false; }

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
    if (metaRead < 4) { _health.failure(true); return false; }

    outType = meta[0];
    outCmd  = meta[1];
    uint16_t len = (static_cast<uint16_t>(meta[2]) << 8) | meta[3];

    // Sanity check length
    if (len > 256) { _health.failure(false); return false; }

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
        if (payloadRead < len) { _health.failure(true); return false; }
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
    if (tailRead < 2) { _health.failure(true); return false; }

    uint8_t expectedChecksum = tail[0];
    uint8_t endByte = tail[1];

    if (endByte != FRAME_END) { _health.failure(false); return false; }

    uint8_t actualChecksum = calculateChecksum(outType, outCmd, outPayload.data(), len);
    if(actualChecksum!=expectedChecksum) { _health.failure(false); return false; }
    _health.response(millis());
    if(outType==0x01&&outCmd==0xff&&!outPayload.empty()) _health.error(outPayload[0]);
    return true;
}

std::vector<RfidTag> Yrm100Reader::scanTags(uint32_t timeoutMs, bool stopAfterFirst, size_t maxTags) {
    std::vector<RfidTag> foundTags;

    unsigned long start = millis();
    while ((millis() - start) < timeoutMs) {
        // Start another inventory round after each single-poll response.
        sendFrame(0x00, 0x22, nullptr, 0);
        uint8_t type = 0;
        uint8_t cmd  = 0;
        std::vector<uint8_t> payload;

        uint32_t elapsed=millis()-start;
        if(elapsed>=timeoutMs) break;
        if (readFrame(type, cmd, payload, min((uint32_t)300,timeoutMs-elapsed))) {
            // Check if tag notification frame
            if (cmd == 0x22 && type == 0x02 && payload.size() >= 7) {
                // Byte 0: RSSI
                int rssiRaw = payload[0];
                int rssiDbm = (int8_t)payload[0];

                // Bytes 1-2: PC Word
                uint16_t pc = (static_cast<uint16_t>(payload[1]) << 8) | payload[2];

                // EPC length in words (bits 15..11 of PC)
                uint8_t epcWords = (pc >> 11) & 0x1F;
                uint8_t epcBytes = epcWords * 2;

                // Validate payload size bounds: 1 (RSSI) + 2 (PC) + epcBytes + 2 (CRC)
                if (epcBytes > 0 && epcBytes <= 50 && (5 + epcBytes) <= payload.size()) {
                    _health.tag(millis());
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

                        // Single-trigger mode only needs the first valid EPC. Returning here
                        // avoids waiting out the full scan timeout after a tag is already read.
                        if (stopAfterFirst || foundTags.size()>=maxTags) return foundTags;
                    }
                } else _health.failure(false);
            } else if (type == 0x01 && cmd == 0xFF) {
                // Fail response (e.g. no tag found / timeout)
                // No tag in this round; keep scanning until the window expires.
                delay(5);
            }
        }
        if(_health.needsRecovery()) break;
    }

    return foundTags;
}

void Yrm100Reader::cancelHeldPoll() {
    _heldPolling=false; _heldFrame.clear();
}

bool Yrm100Reader::pollHeldTag(RfidTag& tag) {
    if(!_heldPolling) {
        sendFrame(0x00,0x22,nullptr,0);
        _heldStarted=millis(); _heldFrame.clear(); _heldPolling=true;
    }
    // Bound each loop's work so a trigger release is handled promptly.
    for(size_t count=0;count<128&&_serial.available()>0;++count) {
        uint8_t byte=_serial.read();
        if(_heldFrame.empty()&&byte!=FRAME_HEADER) continue;
        _heldFrame.push_back(byte);
        if(_heldFrame.size()<5) continue;
        uint16_t length=((uint16_t)_heldFrame[3]<<8)|_heldFrame[4];
        if(length>256) { _health.failure(false); cancelHeldPoll(); return false; }
        if(_heldFrame.size()<length+7) continue;
        uint8_t type=_heldFrame[1],cmd=_heldFrame[2];
        bool valid=_heldFrame[length+6]==FRAME_END&&
            _heldFrame[length+5]==calculateChecksum(type,cmd,_heldFrame.data()+5,length);
        if(!valid) { _health.failure(false); cancelHeldPoll(); return false; }
        _health.response(millis());
        if(type==0x01&&cmd==0xff&&length>0) _health.error(_heldFrame[5]);
        if(valid&&type==0x02&&cmd==0x22&&length>=7) {
            const uint8_t* payload=_heldFrame.data()+5;
            uint16_t pc=((uint16_t)payload[1]<<8)|payload[2];
            uint8_t epcLength=((pc>>11)&0x1f)*2;
            if(epcLength>0&&epcLength<=50&&epcLength+5<=length) {
                tag.epc=bytesToHex(payload+3,epcLength); tag.pc=pc;
                tag.rssiRaw=payload[0]; tag.rssiDbm=(int8_t)payload[0];
                _health.tag(millis());
                cancelHeldPoll(); return true;
            } else { _health.failure(false); cancelHeldPoll(); return false; }
        }
        _heldFrame.clear();
        if(valid&&type==0x01&&cmd==0xff) { _heldPolling=false; return false; }
    }
    if(millis()-_heldStarted>=300) { _health.failure(true); cancelHeldPoll(); }
    return false;
}

String Yrm100Reader::getVersion(uint32_t timeoutMs) {
    // Hardware information requires selector 0x00: BB 00 03 00 01 00 04 7E.
    const uint8_t selector = 0x00;
    sendFrame(0x00, 0x03, &selector, 1);

    uint8_t type = 0;
    uint8_t cmd  = 0;
    std::vector<uint8_t> payload;

    if (readFrame(type, cmd, payload, timeoutMs)) {
        if (type == 0x01 && cmd == 0x03 && payload.size() > 1 && payload[0] == selector) {
            String ver = "";
            for (size_t i = 1; i < payload.size(); i++) {
                char c = static_cast<char>(payload[i]);
                if (isprint(c)) {
                    ver += c;
                }
            }
            if (ver.length()) return ver;
        }
    }
    return "Unknown";
}

bool Yrm100Reader::setTransmitPower(uint8_t dbm, uint32_t timeoutMs) {
    if (dbm > 26) return false;
    uint16_t centiDbm = static_cast<uint16_t>(dbm) * 100;
    uint8_t payload[2] = { static_cast<uint8_t>(centiDbm >> 8), static_cast<uint8_t>(centiDbm & 0xFF) };
    sendFrame(0x00, 0xB6, payload, 2);
    uint8_t type=0, cmd=0; std::vector<uint8_t> response;
    return readFrame(type, cmd, response, timeoutMs) && type == 0x01 && cmd == 0xB6 &&
        !response.empty() && response[0] == 0x00;
}

bool Yrm100Reader::verifyTransmitPower(uint8_t dbm, uint32_t timeoutMs) {
    sendFrame(0x00,0xB7,nullptr,0);
    uint8_t type=0,cmd=0; std::vector<uint8_t> response;
    return readFrame(type,cmd,response,timeoutMs)&&type==0x01&&cmd==0xB7&&response.size()==2&&
        (((uint16_t)response[0]<<8)|response[1])==(uint16_t)dbm*100;
}
