#pragma once
#include "config_manager.h"
#include <cJSON.h>

inline bool jsonUInt(const cJSON* object, const char* key, uint32_t& value, uint32_t maxValue = UINT32_MAX) {
    const cJSON* item = cJSON_GetObjectItemCaseSensitive(object, key);
    if (!cJSON_IsNumber(item) || item->valuedouble < 0 || item->valuedouble > maxValue) return false;
    value = (uint32_t)item->valuedouble;
    return item->valuedouble == value;
}
inline bool jsonText(const cJSON* object, const char* key, String& value) {
    const cJSON* item = cJSON_GetObjectItemCaseSensitive(object, key);
    if (!cJSON_IsString(item) || !item->valuestring) return false;
    value = item->valuestring;
    return true;
}
inline bool jsonFlag(const cJSON* object, const char* key, bool& value) {
    const cJSON* item = cJSON_GetObjectItemCaseSensitive(object, key);
    if (!cJSON_IsBool(item)) return false;
    value = cJSON_IsTrue(item);
    return true;
}
inline String jsonEncode(cJSON* object) {
    char* encoded = cJSON_PrintUnformatted(object);
    String result = encoded ? encoded : "";
    if (encoded) cJSON_free(encoded);
    return result;
}
inline bool parseScannerSettings(const cJSON* object, DeviceConfiguration& c) {
    uint32_t power;
    if (!cJSON_IsObject(object) || !jsonText(object,"server_url",c.serverUrl) ||
        !jsonText(object,"scan_mode",c.scanMode) || !jsonUInt(object,"rf_power",power,26) ||
        !jsonUInt(object,"scan_timeout",c.scanTimeout,30000) ||
        !jsonUInt(object,"heartbeat_interval",c.heartbeatInterval,3600) ||
        !jsonUInt(object,"version",c.configVersion) || !jsonFlag(object,"buzzer_enabled",c.buzzerEnabled) ||
        !jsonFlag(object,"auto_reconnect",c.autoReconnect)) return false;
    c.rfPower = (uint8_t)power;
    return true;
}
inline String encodeConfiguration(const DeviceConfiguration& c) {
    cJSON* object = cJSON_CreateObject();
    if (!object) return "";
    cJSON_AddStringToObject(object,"wifi_ssid",c.wifiSsid.c_str());
    cJSON_AddStringToObject(object,"wifi_password",c.wifiPassword.c_str());
    cJSON_AddStringToObject(object,"server_url",c.serverUrl.c_str());
    cJSON_AddStringToObject(object,"device_id",c.deviceId.c_str());
    cJSON_AddStringToObject(object,"device_token",c.deviceToken.c_str());
    cJSON_AddStringToObject(object,"scan_mode",c.scanMode.c_str());
    cJSON_AddNumberToObject(object,"rf_power",c.rfPower);
    cJSON_AddNumberToObject(object,"scan_timeout",c.scanTimeout);
    cJSON_AddNumberToObject(object,"heartbeat_interval",c.heartbeatInterval);
    cJSON_AddNumberToObject(object,"version",c.configVersion);
    cJSON_AddBoolToObject(object,"buzzer_enabled",c.buzzerEnabled);
    cJSON_AddBoolToObject(object,"auto_reconnect",c.autoReconnect);
    String result = jsonEncode(object); cJSON_Delete(object); return result;
}
inline bool decodeConfiguration(const String& encoded, DeviceConfiguration& c) {
    cJSON* object = cJSON_Parse(encoded.c_str());
    bool valid = object && parseScannerSettings(object,c) && jsonText(object,"wifi_ssid",c.wifiSsid) &&
        jsonText(object,"wifi_password",c.wifiPassword) && jsonText(object,"device_id",c.deviceId) &&
        jsonText(object,"device_token",c.deviceToken);
    cJSON_Delete(object); return valid;
}
