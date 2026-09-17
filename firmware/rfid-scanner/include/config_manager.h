#pragma once
#include <Arduino.h>

struct DeviceConfiguration {
    String wifiSsid, wifiPassword, serverUrl, deviceId, deviceToken;
    String scanMode = "single";
    uint8_t rfPower = 20;
    uint32_t scanTimeout = 3000, heartbeatInterval = 30;
    bool buzzerEnabled = true, autoReconnect = true;
    uint32_t configVersion = 0;
};

class ConfigManager {
public:
    bool begin();
    bool loadConfiguration(DeviceConfiguration& config);
    bool loadPendingConfiguration(DeviceConfiguration& config);
    bool saveConfiguration(const DeviceConfiguration& config);
    bool savePendingConfiguration(const DeviceConfiguration& config);
    bool commitPendingConfiguration(DeviceConfiguration& config);
    void rollbackPendingConfiguration();
    bool hasPendingConfiguration();
    bool validateConfiguration(const DeviceConfiguration& config, bool requireNetwork = true) const;
    bool applyConfiguration(const DeviceConfiguration& config) const;
    void resetConfiguration(bool preserveIdentity = true);
    static String generateDeviceId();
    static String getOrGenerateSetupPin();
private:
    bool read(bool pending, DeviceConfiguration& config);
    bool write(bool pending, const DeviceConfiguration& config);
};
