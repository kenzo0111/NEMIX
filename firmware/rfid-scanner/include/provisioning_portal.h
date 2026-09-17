#pragma once
#include <Arduino.h>
#include <WebServer.h>
#include "config_manager.h"

class ProvisioningPortal {
public:
    ProvisioningPortal(ConfigManager& manager, DeviceConfiguration& config);
    void begin();
    void loop();
    void stop();
    bool active() const { return _active; }

private:
    ConfigManager& _manager;
    DeviceConfiguration& _config;
    WebServer _server;
    bool _active = false;
    uint32_t _startedAt = 0;
    uint8_t _failedAttempts = 0;
    static const uint32_t PORTAL_TIMEOUT_MS = 300000; // 5-minute inactivity timeout

    String page() const;
};
