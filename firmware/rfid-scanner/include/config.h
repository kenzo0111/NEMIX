#pragma once

// ============================================================================
// Network & Laravel Backend API Configuration
// ============================================================================

// --- Wi-Fi Credentials ---
#define WIFI_SSID           "PLDTHOMEFIBR46PRK"
#define WIFI_PASSWORD       "balceresidences2003#"
#define WIFI_CONNECT_TIMEOUT_MS 15000

// --- Laravel API Configuration (DigitalOcean Droplet) ---
#define API_BASE_URL        "https://unc-nemix.com"

// Tag Lookup Endpoint: GET {API_BASE_URL}/rfid-scanner/lookup/{EPC}
#define API_LOOKUP_PATH     "/rfid-scanner/lookup/"

// Device Identification
#define SCANNER_DEVICE_ID   "NEMIX-SCANNER-01"

// API Bearer Token (if your route requires auth; leave empty "" if public)
#define API_BEARER_TOKEN    ""
