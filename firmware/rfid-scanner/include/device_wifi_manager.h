#pragma once
#include <Arduino.h>
#include "config_manager.h"
class DeviceWiFiManager {
public: bool connect(const DeviceConfiguration&,uint32_t); void loop(const DeviceConfiguration&); bool connected() const; bool prolongedFailure() const;
private: uint32_t _disconnectedSince=0,_lastAttempt=0,_backoff=2000; bool _clockReady=false; void synchronizeClock();
};
