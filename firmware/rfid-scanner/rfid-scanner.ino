#include <Arduino.h>
#include "include/pins.h"
#include "include/config.h"
#include "include/config_manager.h"
#include "include/device_wifi_manager.h"
#include "include/provisioning_portal.h"
#include "include/yrm100.h"
#include "include/api_client.h"

Yrm100Reader reader(Serial2,PIN_YRM100_EN,PIN_YRM100_RX,PIN_YRM100_TX);
ConfigManager configManager;DeviceConfiguration config;DeviceWiFiManager wifiManager;ProvisioningPortal portal(configManager,config);NemixApiClient apiClient;
bool scannerReady=false,scanTriggered=false;int lastButton=HIGH;uint32_t pressedAt=0,lastHeartbeat=0;
void startSetupMode(){if(!portal.active()){Serial.println(F("[RECOVERY] Starting local setup access point."));portal.begin();}}
bool applyCandidate(DeviceConfiguration candidate){
    if(!configManager.validateConfiguration(candidate,true)||!configManager.savePendingConfiguration(candidate)){apiClient.reportConfigurationStatus(candidate.configVersion,"failed","validation failed");return false;}
    bool networkChanged=candidate.wifiSsid!=config.wifiSsid||candidate.wifiPassword!=config.wifiPassword;
    if(networkChanged&&!wifiManager.connect(candidate,WIFI_CONNECT_TIMEOUT_MS)){
        configManager.rollbackPendingConfiguration();wifiManager.connect(config,WIFI_CONNECT_TIMEOUT_MS);
        apiClient.reportConfigurationStatus(candidate.configVersion,"rolled_back","new Wi-Fi connection failed");return false;
    }
    if(!reader.setTransmitPower(candidate.rfPower)){
        configManager.rollbackPendingConfiguration();if(networkChanged)wifiManager.connect(config,WIFI_CONNECT_TIMEOUT_MS);
        apiClient.reportConfigurationStatus(candidate.configVersion,"rolled_back","reader rejected RF power");return false;
    }
    if(!configManager.commitPendingConfiguration(config)){apiClient.reportConfigurationStatus(candidate.configVersion,"failed","NVS commit failed");return false;}
    apiClient.reportConfigurationStatus(config.configVersion,"applied");apiClient.configure(config);return true;
}
void executeScan(){uint32_t start=millis();auto tags=reader.scanTags(config.scanTimeout);Serial.printf("[SCAN] %u tag(s) in %lu ms.\n",tags.size(),millis()-start);if(wifiManager.connected())for(const auto& tag:tags)apiClient.submitScan(tag.epc,tag.rssiDbm);}
void setup(){Serial.begin(SERIAL_DEBUG_BAUD);pinMode(PIN_TRIGGER_BUTTON,INPUT_PULLUP);pinMode(PIN_YRM100_EN,OUTPUT);digitalWrite(PIN_YRM100_EN,LOW);configManager.begin();bool hasActive=configManager.loadConfiguration(config);if(!hasActive){config.deviceId=ConfigManager::generateDeviceId();config.serverUrl="https://example.invalid";}if(configManager.hasPendingConfiguration()){DeviceConfiguration pending;if(configManager.loadPendingConfiguration(pending)&&wifiManager.connect(pending,WIFI_CONNECT_TIMEOUT_MS))configManager.commitPendingConfiguration(config);else{configManager.rollbackPendingConfiguration();if(hasActive)wifiManager.connect(config,WIFI_CONNECT_TIMEOUT_MS);}}else if(hasActive&&configManager.validateConfiguration(config,true))wifiManager.connect(config,WIFI_CONNECT_TIMEOUT_MS);apiClient.configure(config);if(!wifiManager.connected())startSetupMode();reader.begin(YRM100_DEFAULT_BAUD);scannerReady=reader.getVersion()!="Unknown";if(scannerReady&&!reader.setTransmitPower(config.rfPower))Serial.println(F("[RFID] RF power setting rejected; defaults retained."));Serial.printf("[READY] Device %s firmware %s\n",config.deviceId.c_str(),FIRMWARE_VERSION);}
void loop(){portal.loop();wifiManager.loop(config);int button=digitalRead(PIN_TRIGGER_BUTTON);if(button==LOW&&lastButton==HIGH)pressedAt=millis();if(button==LOW&&!scanTriggered&&millis()-pressedAt>=RECOVERY_HOLD_MS){scanTriggered=true;startSetupMode();}if(button==HIGH&&lastButton==LOW){if(!scanTriggered&&millis()-pressedAt>50)executeScan();scanTriggered=false;pressedAt=0;}lastButton=button;if(wifiManager.prolongedFailure())startSetupMode();if(wifiManager.connected()&&millis()-lastHeartbeat>=config.heartbeatInterval*1000UL){lastHeartbeat=millis();uint32_t serverVersion=config.configVersion;if(apiClient.sendHeartbeat(millis()/1000,scannerReady,serverVersion)&&serverVersion>config.configVersion){DeviceConfiguration candidate=config;if(apiClient.fetchConfiguration(candidate)){apiClient.fetchNetworkConfiguration(candidate,config.configVersion);applyCandidate(candidate);}}}if(Serial.available()&&Serial.read()=='s')executeScan();delay(2);}
