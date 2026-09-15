#pragma once

#define FIRMWARE_VERSION "2.0.4"
#define API_CONFIG_PATH "/api/hardware/rfid/config"
#define API_NETWORK_CONFIG_PATH "/api/hardware/rfid/network-config"
#define API_HEARTBEAT_PATH "/api/hardware/rfid/heartbeat"
#define API_CONFIG_STATUS_PATH "/api/hardware/rfid/config/status"
#define API_SCAN_PATH "/api/hardware/rfid/scan"

#define WIFI_CONNECT_TIMEOUT_MS 15000UL
#define WIFI_FAILURE_SETUP_MS 180000UL
#define WIFI_RECONNECT_MIN_MS 2000UL
#define WIFI_RECONNECT_MAX_MS 60000UL
#define RECOVERY_HOLD_MS 8000UL
#define DEFAULT_SCAN_TIMEOUT_MS 3000UL
#define DEFAULT_HEARTBEAT_INTERVAL 30UL
#define DEFAULT_RF_POWER 20
