#pragma once

// ============================================================================
// Pin Definitions for ESP32 WROOM-32 Handheld RFID Scanner
// ============================================================================

// --- Physical Trigger Button ---
// GREY wire  -> GND
// WHITE wire -> D27 (GPIO 27)
// Uses internal pull-up resistor. Reads LOW when trigger is pressed.
#define PIN_TRIGGER_BUTTON    27

// --- YRM100 UHF RFID Reader Module ---
// GREEN wire -> D26 (GPIO 26): Module Enable (EN). HIGH = Wake/Active, LOW = Sleep
#define PIN_YRM100_EN         26

// BLACK wire -> D16 (GPIO 16): ESP32 Hardware UART2 RX (Connects to YRM100 TXD)
#define PIN_YRM100_RX         16

// YELLOW wire -> D17 (GPIO 17): ESP32 Hardware UART2 TX (Connects to YRM100 RXD)
#define PIN_YRM100_TX         17

// --- UART Configuration ---
#define YRM100_DEFAULT_BAUD   115200
#define SERIAL_DEBUG_BAUD     115200
