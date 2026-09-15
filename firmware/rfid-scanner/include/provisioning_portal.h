#pragma once
#include <Arduino.h>
#include <WebServer.h>
#include "config_manager.h"
class ProvisioningPortal { public: ProvisioningPortal(ConfigManager&,DeviceConfiguration&);void begin();void loop();bool active()const{return _active;} private:ConfigManager&_manager;DeviceConfiguration&_config;WebServer _server;bool _active=false;String page()const;};
