#include <Arduino.h>
#include "include/pins.h"
#include "include/config.h"
#include "include/config_manager.h"
#include "include/device_wifi_manager.h"
#include "include/provisioning_portal.h"
#include "include/yrm100.h"
#include "include/api_client.h"
#include "include/scan_queue.h"
#include "include/trigger_control.h"

Yrm100Reader reader(Serial2,PIN_YRM100_EN,PIN_YRM100_RX,PIN_YRM100_TX);
ConfigManager configManager;
DeviceConfiguration config;
DeviceWiFiManager wifiManager;
ProvisioningPortal portal(configManager,config);
NemixApiClient apiClient;
ScanQueue scanQueue;
bool scannerReady=false,automaticPortalOpened=false,inventoryHeld=false;
TriggerControl trigger;
uint32_t lastHeartbeat=0,lastHeldSave=0;
uint32_t lastReaderCheck=0,readerBackoff=2000,recoveryAttempts=0;
bool statusDirty=true;
size_t heldCapacity=0;
std::vector<String> heldEpcs;
std::vector<RfidTag> heldPending;

void startSetupMode() { if(!portal.active()) portal.begin(); }

const char* scanBlockReason() {
    return !scannerReady?"reader_unavailable":scanQueue.blockReason();
}

void printReaderDiagnostics() {
    const auto& h=reader.health();
    Serial.printf("[RFID] reader=%s queue=%u block=%s responses=%lu tags=%lu timeouts=%lu invalid=%lu errors=%lu last_error=%d recovery_attempts=%lu\n",
        scannerReady?"ready":"recovering",(unsigned)scanQueue.count(),scanBlockReason(),
        (unsigned long)h.responses,(unsigned long)h.tags,(unsigned long)h.timeouts,
        (unsigned long)h.invalidFrames,(unsigned long)h.readerErrors,h.lastError,(unsigned long)recoveryAttempts);
}

bool initializeReader(bool restart) {
    if(restart) { ++recoveryAttempts; reader.restart(); }
    String version=reader.getVersion(500);
    if(version=="Unknown") { Serial.println(F("[RFID] No valid information response; will retry while idle.")); return false; }
    if(!reader.setTransmitPower(config.rfPower,500)||!reader.verifyTransmitPower(config.rfPower,500)) {
        Serial.println(F("[RFID] RF power acknowledgement/readback failed; will retry while idle.")); return false;
    }
    Serial.printf("[RFID] Reader %s responding; RF power verified at %u dBm. Tag reading requires an inventory.\n",version.c_str(),config.rfPower);
    return true;
}

void checkScanHealth() {
    if(scannerReady&&reader.health().needsRecovery()) {
        scannerReady=false; statusDirty=true; reader.cancelHeldPoll();
        lastReaderCheck=millis(); readerBackoff=2000;
        Serial.println(F("[RFID] Repeated UART failures; release trigger for automatic reader recovery."));
    }
}

void serviceReader() {
    const uint32_t now=millis();
    if(scannerReady) {
        if(now-lastReaderCheck<15000) return;
        lastReaderCheck=now;
        // A module-only reset may preserve UART replies but lose the configured RF power.
        if(reader.getVersion(500)!="Unknown"&&reader.verifyTransmitPower(config.rfPower,500)) return;
        scannerReady=false; statusDirty=true; readerBackoff=2000;
        Serial.println(F("[RFID] Health/power verification failed; scheduling recovery."));
        return;
    }
    if(now-lastReaderCheck<readerBackoff) return;
    scannerReady=initializeReader(true); lastReaderCheck=millis(); statusDirty=true;
    readerBackoff=scannerReady?2000:min(readerBackoff*2,(uint32_t)60000);
    printReaderDiagnostics();
}

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
    if(!error.length()&&(!scannerReady||(powerChanged&&(!reader.setTransmitPower(candidate.rfPower)||!reader.verifyTransmitPower(candidate.rfPower))))) error="Reader unavailable or RF power verification failed";
    if(!error.length()) {
        commitAttempted=true;
        if(!configManager.commitPendingConfiguration(config)) error="Configuration storage commit failed";
    }
    if(error.length()) {
        bool restored=true;
        if(powerChanged&&(!reader.setTransmitPower(previous.rfPower)||!reader.verifyTransmitPower(previous.rfPower))) { scannerReady=false; statusDirty=true; restored=false; }
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
    if(!scannerReady||!scanQueue.canScan()) { Serial.printf("[SCAN] Blocked: %s\n",scanBlockReason()); statusDirty=true; return; }
    // A single press can produce at most one EPC, even if the button remains held.
    auto tags=reader.scanTags(config.scanTimeout,true,1);
    Serial.printf("[SCAN] Captured %u unique tag(s).\n",tags.size());
    if(!tags.empty()&&!scanQueue.enqueue(tags)) Serial.println(F("[SCAN] Storage failed; keep device powered while delivery retries."));
    checkScanHealth(); statusDirty=true; printReaderDiagnostics();
}

void persistHeldTags() {
    if(heldPending.empty()) return;
    if(!scanQueue.enqueue(heldPending)) Serial.println(F("[SCAN] Storage failed; keep device powered while delivery retries."));
    heldPending.clear(); lastHeldSave=millis();
}

void beginHeldInventory() {
    if(!scannerReady||!scanQueue.canScan()) { Serial.printf("[SCAN] Blocked: %s\n",scanBlockReason()); statusDirty=true; return; }
    heldEpcs.clear(); heldPending.clear(); heldCapacity=scanQueue.availableSlots();
    inventoryHeld=true; lastHeldSave=millis(); reader.cancelHeldPoll();
    Serial.println(F("[SCAN] Inventory started; release trigger to stop and deliver."));
}

void finishHeldInventory() {
    reader.cancelHeldPoll(); persistHeldTags(); inventoryHeld=false;
    Serial.printf("[SCAN] Inventory stopped: %u unique tag(s).\n",heldEpcs.size());
    statusDirty=true; printReaderDiagnostics();
    heldEpcs.clear();
}

void pollHeldInventory() {
    if(!scannerReady||heldEpcs.size()>=heldCapacity||!scanQueue.canScan()) return;
    RfidTag tag;
    if(reader.pollHeldTag(tag)) {
        bool seen=false;
        for(const auto& epc:heldEpcs) if(epc==tag.epc) { seen=true; break; }
        if(!seen) {
            heldEpcs.push_back(tag.epc); heldPending.push_back(tag);
            Serial.printf("[SCAN] Inventory captured %u unique tag(s).\n",heldEpcs.size());
        }
    }
    checkScanHealth();
    if(heldPending.size()>=20||(!heldPending.empty()&&millis()-lastHeldSave>=1000)||heldEpcs.size()>=heldCapacity) persistHeldTags();
    if(heldEpcs.size()>=heldCapacity) {
        reader.cancelHeldPoll(); Serial.println(F("[SCAN] Delivery capacity reached; release trigger to upload."));
    }
}

void setup() {
    Serial.begin(SERIAL_DEBUG_BAUD);
    pinMode(PIN_TRIGGER_BUTTON,INPUT_PULLUP); pinMode(PIN_YRM100_EN,OUTPUT); digitalWrite(PIN_YRM100_EN,LOW);
    // Recovery is available only when held from boot, never during an inventory hold.
    bool setupRequested=false;
    trigger=TriggerControl(digitalRead(PIN_TRIGGER_BUTTON)==LOW,millis());
    if(trigger.held()) {
        Serial.println(F("[RECOVERY] Keep trigger held for eight seconds to open Wi-Fi setup."));
        while(trigger.held()&&!setupRequested) {
            setupRequested=trigger.update(digitalRead(PIN_TRIGGER_BUTTON)==LOW,millis())==TriggerControl::Event::Setup;
            delay(2);
        }
    }
    configManager.begin(); scanQueue.begin();
    bool hasActive=configManager.loadConfiguration(config);
    if(!hasActive) { config.deviceId=ConfigManager::generateDeviceId(); config.serverUrl="https://example.invalid"; }
    reader.begin(YRM100_DEFAULT_BAUD);
    for(uint8_t attempt=0;attempt<3&&!scannerReady;++attempt) scannerReady=initializeReader(attempt>0);
    lastReaderCheck=millis(); printReaderDiagnostics();
    if(!setupRequested&&hasActive&&configManager.validateConfiguration(config,true)) wifiManager.connect(config,WIFI_CONNECT_TIMEOUT_MS);
    apiClient.configure(config);
    if(configManager.hasPendingConfiguration()) {
        DeviceConfiguration pending;
        if(configManager.loadPendingConfiguration(pending)) applyCandidate(pending);
        else configManager.rollbackPendingConfiguration();
    }
    if(setupRequested||!wifiManager.connected()) { startSetupMode(); automaticPortalOpened=true; }
    Serial.printf("[READY] Device %s firmware %s\n",config.deviceId.c_str(),FIRMWARE_VERSION);
}

void loop() {
    bool buttonHeld=digitalRead(PIN_TRIGGER_BUTTON)==LOW;
    auto action=trigger.update(buttonHeld,millis());
    if(action==TriggerControl::Event::Press) {
        if(config.scanMode=="inventory") beginHeldInventory();
        else executeScan();
    }
    if(action==TriggerControl::Event::Release&&inventoryHeld) finishHeldInventory();
    if(inventoryHeld) {
        // Stop issuing polls on the physical release; debounce only controls session completion.
        if(buttonHeld) pollHeldInventory(); else reader.cancelHeldPoll();
        delay(2); return;
    }
    // Defer blocking HTTPS and clock synchronization until the trigger is released.
    if(buttonHeld) { delay(2); return; }
    serviceReader();
    portal.loop(); wifiManager.loop(config);
    if(wifiManager.connected()) automaticPortalOpened=false;
    if(wifiManager.prolongedFailure()&&!automaticPortalOpened) { startSetupMode(); automaticPortalOpened=true; }
    if(wifiManager.connected()&&((statusDirty&&millis()-lastHeartbeat>=2000)||millis()-lastHeartbeat>=config.heartbeatInterval*1000UL)) {
        lastHeartbeat=millis(); uint32_t serverVersion=config.configVersion;
        bool sent=apiClient.sendHeartbeat(millis()/1000,scannerReady,serverVersion,reader.health(),scanQueue.count(),scanBlockReason(),recoveryAttempts);
        if(sent) statusDirty=false;
        if(sent&&serverVersion>config.configVersion) {
            DeviceConfiguration candidate=config;
            if(apiClient.fetchConfiguration(candidate)) applyCandidate(candidate);
            else Serial.println(F("[CONFIG] Download failed; version unchanged, retrying on next heartbeat."));
        }
    }
    size_t previousQueueCount=scanQueue.count();
    String previousQueueBlock=scanQueue.blockReason();
    scanQueue.loop(apiClient,wifiManager.connected());
    if(previousQueueCount!=scanQueue.count()||previousQueueBlock!=scanQueue.blockReason()) statusDirty=true;
    if(Serial.available()) {
        char command=Serial.read();
        if(command=='s') executeScan();
        else if(command=='d') { Serial.printf("[CONFIG] Firmware %s mode=%s version=%lu\n",FIRMWARE_VERSION,config.scanMode.c_str(),(unsigned long)config.configVersion); printReaderDiagnostics(); }
    }
    delay(2);
}
