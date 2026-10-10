#include <Arduino.h>
#include "include/pins.h"
#include "include/config.h"
#include "include/config_manager.h"
#include "include/device_wifi_manager.h"
#include "include/provisioning_portal.h"
#include "include/yrm100.h"
#include "include/api_client.h"
#include "include/scan_queue.h"

Yrm100Reader reader(Serial2,PIN_YRM100_EN,PIN_YRM100_RX,PIN_YRM100_TX);
ConfigManager configManager;
DeviceConfiguration config;
DeviceWiFiManager wifiManager;
ProvisioningPortal portal(configManager,config);
NemixApiClient apiClient;
ScanQueue scanQueue;
bool scannerReady=false,scanTriggered=false,automaticPortalOpened=false;
int lastButton=HIGH;
uint32_t pressedAt=0,lastHeartbeat=0;

void startSetupMode() { if(!portal.active()) portal.begin(); }

bool applyCandidate(const DeviceConfiguration& candidate) {
    const DeviceConfiguration previous=config;
    if(!configManager.validateConfiguration(candidate,true)) {
        apiClient.reportConfigurationStatus(candidate.configVersion,"failed","Invalid configuration"); return false;
    }
    if(!configManager.savePendingConfiguration(candidate)) {
        configManager.rollbackPendingConfiguration();
        apiClient.reportConfigurationStatus(candidate.configVersion,"failed","Could not persist pending configuration"); return false;
    }
    bool networkChanged=candidate.wifiSsid!=previous.wifiSsid||candidate.wifiPassword!=previous.wifiPassword;
    bool powerChanged=candidate.rfPower!=previous.rfPower;
    String error; bool commitAttempted=false;
    if((networkChanged||!wifiManager.connected())&&!wifiManager.connect(candidate,WIFI_CONNECT_TIMEOUT_MS)) error="New Wi-Fi connection failed";
    if(!error.length()) {
        apiClient.configure(candidate);
        if(!apiClient.verifyConnection(candidate.configVersion)) error="New network or server cannot authenticate this version";
    }
    if(!error.length()&&(!scannerReady||(powerChanged&&!reader.setTransmitPower(candidate.rfPower)))) error="Reader is unavailable or rejected RF power";
    if(!error.length()) {
        commitAttempted=true;
        if(!configManager.commitPendingConfiguration(config)) error="Configuration storage commit failed";
    }
    if(error.length()) {
        bool restored=true;
        if(powerChanged&&!reader.setTransmitPower(previous.rfPower)) { scannerReady=false; restored=false; }
        configManager.rollbackPendingConfiguration();
        if(configManager.validateConfiguration(previous,true)) {
            if(commitAttempted&&!configManager.saveConfiguration(previous)) restored=false;
            if((networkChanged||!wifiManager.connected())&&!wifiManager.connect(previous,WIFI_CONNECT_TIMEOUT_MS)) restored=false;
        } else restored=false;
        config=previous; apiClient.configure(previous);
        if(!restored) error+="; recovery incomplete, use local setup";
        apiClient.reportConfigurationStatus(candidate.configVersion,restored?"rolled_back":"failed",error);
        Serial.printf("[CONFIG] %s: %s\n",restored?"Rolled back":"Failed",error.c_str()); return false;
    }
    apiClient.configure(config); apiClient.reportConfigurationStatus(config.configVersion,"applied");
    Serial.printf("[CONFIG] Applied version %lu\n",(unsigned long)config.configVersion); return true;
}

void executeScan() {
    if(!scannerReady||!scanQueue.canScan()) { Serial.println(F("[SCAN] Reader unavailable or delivery queue full.")); return; }
    auto tags=reader.scanTags(config.scanTimeout,config.scanMode=="single",scanQueue.availableSlots());
    Serial.printf("[SCAN] Captured %u unique tag(s).\n",tags.size());
    if(!tags.empty()&&!scanQueue.enqueue(tags)) Serial.println(F("[SCAN] Storage failed; keep device powered while delivery retries."));
}

void setup() {
    Serial.begin(SERIAL_DEBUG_BAUD);
    pinMode(PIN_TRIGGER_BUTTON,INPUT_PULLUP); pinMode(PIN_YRM100_EN,OUTPUT); digitalWrite(PIN_YRM100_EN,LOW);
    configManager.begin(); scanQueue.begin();
    bool hasActive=configManager.loadConfiguration(config);
    if(!hasActive) { config.deviceId=ConfigManager::generateDeviceId(); config.serverUrl="https://example.invalid"; }
    if(hasActive&&configManager.validateConfiguration(config,true)) wifiManager.connect(config,WIFI_CONNECT_TIMEOUT_MS);
    apiClient.configure(config);
    reader.begin(YRM100_DEFAULT_BAUD);
    String readerVersion="Unknown";
    for(uint8_t attempt=0;attempt<3&&readerVersion=="Unknown";++attempt) {
        readerVersion=reader.getVersion(500);
        if(readerVersion=="Unknown") delay(200);
    }
    scannerReady=readerVersion!="Unknown";
    if(scannerReady) {
        Serial.printf("[RFID] Reader %s detected.\n",readerVersion.c_str());
        scannerReady=reader.setTransmitPower(config.rfPower,500);
        Serial.println(scannerReady?F("[RFID] RF power acknowledged; reader ready."):F("[RFID] ERROR: Reader rejected RF power; scanning disabled."));
    } else Serial.println(F("[RFID] ERROR: No valid reader information response; check module power, UART wiring and baud rate."));
    if(configManager.hasPendingConfiguration()) {
        DeviceConfiguration pending;
        if(configManager.loadPendingConfiguration(pending)) applyCandidate(pending);
        else configManager.rollbackPendingConfiguration();
    }
    if(!wifiManager.connected()) { startSetupMode(); automaticPortalOpened=true; }
    Serial.printf("[READY] Device %s firmware %s\n",config.deviceId.c_str(),FIRMWARE_VERSION);
}

void loop() {
    portal.loop(); wifiManager.loop(config);
    int button=digitalRead(PIN_TRIGGER_BUTTON);
    if(button==LOW&&lastButton==HIGH) pressedAt=millis();
    if(button==LOW&&!scanTriggered&&millis()-pressedAt>=RECOVERY_HOLD_MS) { scanTriggered=true; startSetupMode(); }
    if(button==HIGH&&lastButton==LOW) {
        if(!scanTriggered&&millis()-pressedAt>50) executeScan();
        scanTriggered=false; pressedAt=0;
    }
    lastButton=button;
    if(wifiManager.connected()) automaticPortalOpened=false;
    if(wifiManager.prolongedFailure()&&!automaticPortalOpened) { startSetupMode(); automaticPortalOpened=true; }
    if(wifiManager.connected()&&millis()-lastHeartbeat>=config.heartbeatInterval*1000UL) {
        lastHeartbeat=millis(); uint32_t serverVersion=config.configVersion;
        if(apiClient.sendHeartbeat(millis()/1000,scannerReady,serverVersion)&&serverVersion>config.configVersion) {
            DeviceConfiguration candidate=config;
            if(apiClient.fetchConfiguration(candidate)) applyCandidate(candidate);
            else Serial.println(F("[CONFIG] Download failed; version unchanged, retrying on next heartbeat."));
        }
    }
    scanQueue.loop(apiClient,wifiManager.connected());
    if(Serial.available()&&Serial.read()=='s') executeScan();
    delay(2);
}
