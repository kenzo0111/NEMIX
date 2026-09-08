/*
 * ============================================================================
 * Project: ESP32 Handheld UHF RFID Scanner - Complete Firmware
 * Target:  ESP32 WROOM-32
 * 
 * Hardware Wiring:
 *   Trigger Button:
 *     - GREY  -> GND
 *     - WHITE -> GPIO 27 (D27) (Active LOW with internal pull-up)
 *   YRM100 UHF RFID Reader:
 *     - RED    -> 3V3 (or 5V boost converter)
 *     - BLUE   -> GND
 *     - GREEN  -> GPIO 26 (D26) (EN - Module Enable)
 *     - BLACK  -> GPIO 16 (D16) (ESP32 RX2 <- YRM100 TXD)
 *     - YELLOW -> GPIO 17 (D17) (ESP32 TX2 -> YRM100 RXD)
 * ============================================================================
 */

#include <Arduino.h>
#include "include/pins.h"
#include "include/config.h"
#include "include/yrm100.h"
#include "include/api_client.h"

// Hardware instances
Yrm100Reader reader(Serial2, PIN_YRM100_EN, PIN_YRM100_RX, PIN_YRM100_TX);
NemixApiClient apiClient(API_BASE_URL, API_LOOKUP_PATH, API_BEARER_TOKEN);

// Button state tracking with software debounce
int lastButtonState = HIGH;
int currentButtonState = HIGH;
unsigned long lastDebounceTime = 0;
const unsigned long DEBOUNCE_DELAY_MS = 50;

// Prevent continuous re-scanning while trigger is held down
bool scanTriggeredForPress = false;

void executeScan() {
    Serial.println(F("\n========================================================"));
    Serial.println(F(">>> [TRIGGER] Scanning for UHF RFID tags..."));
    Serial.println(F("========================================================"));

    unsigned long scanStart = millis();
    std::vector<RfidTag> tags = reader.scanTags(400);
    unsigned long duration = millis() - scanStart;

    if (tags.empty()) {
        Serial.printf("[SCAN] No tags detected in range (%lu ms).\n", duration);
    } else {
        Serial.printf("[SCAN] %u tag(s) detected in %lu ms:\n", tags.size(), duration);
        for (size_t i = 0; i < tags.size(); i++) {
            const auto& tag = tags[i];
            Serial.printf("  [%u] EPC: %s | RSSI: %d dBm (Raw 0x%02X) | PC: 0x%04X\n",
                          i + 1, tag.epc.c_str(), tag.rssiDbm, tag.rssiRaw, tag.pc);

            // If Wi-Fi is connected, query Laravel backend for item data
            if (apiClient.checkWifi()) {
                apiClient.lookupTag(tag.epc);
            }
        }
    }
    Serial.println(F("--------------------------------------------------------"));
}

void setup() {
    // 1. Initialize Debug Serial Monitor
    Serial.begin(SERIAL_DEBUG_BAUD);
    delay(1000);

    Serial.println(F("\n========================================================"));
    Serial.println(F("  ESP32 UHF RFID SCANNER - PRODUCTION FIRMWARE"));
    Serial.printf(F("  Device ID: %s\n"), SCANNER_DEVICE_ID);
    Serial.println(F("========================================================"));

    // 2. Configure Trigger Button
    pinMode(PIN_TRIGGER_BUTTON, INPUT_PULLUP);
    currentButtonState = digitalRead(PIN_TRIGGER_BUTTON);
    lastButtonState = currentButtonState;

    // 3. Keep YRM100 asleep during Wi-Fi connection to prevent 3.3V power sag
    pinMode(PIN_YRM100_EN, OUTPUT);
    digitalWrite(PIN_YRM100_EN, LOW);

    // 4. Initialize Wi-Fi Connection
    apiClient.beginWifi(WIFI_SSID, WIFI_PASSWORD);

    // 5. Wake and initialize YRM100 UHF RFID Reader
    Serial.println(F("[INIT] Initializing YRM100 UHF RFID Reader..."));
    reader.begin(YRM100_DEFAULT_BAUD);

    String readerVer = reader.getVersion();
    Serial.printf("[INIT] YRM100 Firmware Version: %s\n", readerVer.c_str());

    Serial.println(F("\nREADY TO SCAN!"));
    Serial.println(F("  - Pull physical trigger to scan tags"));
    Serial.println(F("  - Type 's' in Serial Monitor to trigger manual scan"));
    Serial.println(F("  - Type 'v' in Serial Monitor to query reader version"));
    Serial.println(F("========================================================\n"));
}

void loop() {
    // --- Trigger Button Debounce & Scan Trigger ---
    int reading = digitalRead(PIN_TRIGGER_BUTTON);

    if (reading != lastButtonState) {
        lastDebounceTime = millis();
    }

    if ((millis() - lastDebounceTime) > DEBOUNCE_DELAY_MS) {
        if (reading != currentButtonState) {
            currentButtonState = reading;

            if (currentButtonState == LOW) {
                // Button was just pressed down
                if (!scanTriggeredForPress) {
                    scanTriggeredForPress = true;
                    executeScan();
                }
            } else {
                // Button was released
                scanTriggeredForPress = false;
            }
        }
    }
    lastButtonState = reading;

    // --- Interactive Serial Console Commands ---
    if (Serial.available() > 0) {
        char c = Serial.read();
        if (c == 's' || c == 'S') {
            executeScan();
        } else if (c == 'v' || c == 'V') {
            String ver = reader.getVersion();
            Serial.printf("[INFO] Reader Version: %s\n", ver.c_str());
        }
    }
}
