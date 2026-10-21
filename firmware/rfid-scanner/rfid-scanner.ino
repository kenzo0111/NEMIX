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
#include "include/usb_provisioning.h"
#include "include/wifi_profiles.h"

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
uint32_t lastReaderCheck=0,recoveryAttempts=0;
UsbProvisioningInput usbInput;
WifiProfiles wifiProfiles;
size_t heldCapacity=0;
std::vector<String> heldEpcs;
std::vector<RfidTag> heldPending;

void startSetupMode() { if(!portal.active()) portal.begin(); }

bool applyCandidate(DeviceConfiguration candidate) {
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
        if(!apiClient.verifyConnection(candidate)) error="New network or server cannot authenticate this version";
    }
    // Network-only recovery remains available when the reader is disconnected.
    if(!error.length()&&powerChanged&&(!scannerReady||!reader.setTransmitPower(candidate.rfPower))) error="Reader is unavailable or rejected RF power";
    if(!error.length()) {
        if(!configManager.savePendingConfiguration(candidate)) error="Could not persist verified configuration";
        else {
            commitAttempted=true;
            if(!configManager.commitPendingConfiguration(config)) error="Configuration storage commit failed";
        }
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
    if(!wifiProfiles.save({config.wifiSsid,config.wifiPassword})) Serial.println(F("[WIFI] Active configuration saved, but Wi-Fi profile storage failed or is full."));
    apiClient.configure(config); apiClient.reportConfigurationStatus(config.configVersion,"applied");
    Serial.printf("[CONFIG] Applied version %lu\n",(unsigned long)config.configVersion); return true;
}

void executeScan() {
    if(!scannerReady||!scanQueue.canScan()) { Serial.println(F("[SCAN] Reader unavailable or delivery queue full.")); return; }
    // A single press can produce at most one EPC, even if the button remains held.
    auto tags=reader.scanTags(config.scanTimeout,true,1);
    if(reader.health().needsRecovery()) scannerReady=false;
    Serial.printf("[SCAN] Captured %u unique tag(s).\n",tags.size());
    if(!tags.empty()&&!scanQueue.enqueue(tags)) Serial.println(F("[SCAN] Storage failed; keep device powered while delivery retries."));
}

void persistHeldTags() {
    if(heldPending.empty()) return;
    if(!scanQueue.enqueue(heldPending)) Serial.println(F("[SCAN] Storage failed; keep device powered while delivery retries."));
    heldPending.clear(); lastHeldSave=millis();
}

void beginHeldInventory() {
    if(!scannerReady||!scanQueue.canScan()) { Serial.println(F("[SCAN] Reader unavailable or delivery queue full.")); return; }
    heldEpcs.clear(); heldPending.clear(); heldCapacity=scanQueue.availableSlots();
    inventoryHeld=true; lastHeldSave=millis(); reader.cancelHeldPoll();
    Serial.println(F("[SCAN] Inventory started; release trigger to stop and deliver."));
}

void finishHeldInventory() {
    reader.cancelHeldPoll(); persistHeldTags(); inventoryHeld=false;
    Serial.printf("[SCAN] Inventory stopped: %u unique tag(s).\n",heldEpcs.size());
    heldEpcs.clear();
}

void pollHeldInventory() {
    if(!scannerReady) return;
    if(heldEpcs.size()>=heldCapacity||!scanQueue.canScan()) return;
    RfidTag tag;
    if(reader.pollHeldTag(tag)) {
        bool seen=false;
        for(const auto& epc:heldEpcs) if(epc==tag.epc) { seen=true; break; }
        if(!seen) {
            heldEpcs.push_back(tag.epc); heldPending.push_back(tag);
            Serial.printf("[SCAN] Inventory captured %u unique tag(s).\n",heldEpcs.size());
        }
    }
    if(reader.health().needsRecovery()) { scannerReady=false; reader.cancelHeldPoll(); }
    if(heldPending.size()>=20||(!heldPending.empty()&&millis()-lastHeldSave>=1000)||heldEpcs.size()>=heldCapacity) persistHeldTags();
    if(heldEpcs.size()>=heldCapacity) {
        reader.cancelHeldPoll(); Serial.println(F("[SCAN] Delivery capacity reached; release trigger to upload."));
    }
}

void setup() {
    // A complete USB configuration may exceed the default UART RX buffer.
    Serial.setRxBufferSize(2048);
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
    if(hasActive&&!wifiProfiles.save({config.wifiSsid,config.wifiPassword})) Serial.println(F("[WIFI] Could not remember active Wi-Fi profile."));
    if(!hasActive) { config.deviceId=ConfigManager::generateDeviceId(); config.serverUrl="https://example.invalid"; }
    if(!setupRequested&&hasActive&&configManager.validateConfiguration(config,true)) wifiManager.connect(config,WIFI_CONNECT_TIMEOUT_MS);
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
    else if(hasActive&&config.rebaseNetwork&&wifiManager.connected()) applyCandidate(config);
    if(setupRequested||!wifiManager.connected()) { startSetupMode(); automaticPortalOpened=true; }
    lastReaderCheck=millis();
    Serial.printf("[READY] Device %s firmware %s\n",config.deviceId.c_str(),FIRMWARE_VERSION);
}

void checkReaderWhileIdle() {
    if(millis()-lastReaderCheck<(scannerReady?30000UL:5000UL)) return;
    lastReaderCheck=millis();
    if(!scannerReady) { ++recoveryAttempts; reader.wake(); }
    scannerReady=reader.getVersion(300)!="Unknown"&&reader.setTransmitPower(config.rfPower,300);
    Serial.println(scannerReady?F("[RFID] Reader communication and RF power acknowledged."):F("[RFID] Reader unavailable; will retry while idle."));
}

String readerDiagnostics() {
    const auto& health=reader.health();
    cJSON* object=cJSON_CreateObject(); if(!object) return "";
    cJSON_AddNumberToObject(object,"responses",health.responses);
    cJSON_AddNumberToObject(object,"tags",health.tags);
    cJSON_AddNumberToObject(object,"timeouts",health.timeouts);
    cJSON_AddNumberToObject(object,"invalid_frames",health.invalidFrames);
    cJSON_AddNumberToObject(object,"reader_errors",health.readerErrors);
    cJSON_AddNumberToObject(object,"last_error",health.lastError);
    cJSON_AddNumberToObject(object,"queue_count",scanQueue.count());
    cJSON_AddStringToObject(object,"scan_block_reason",scannerReady?scanQueue.blockReason():"reader_unavailable");
    cJSON_AddNumberToObject(object,"recovery_attempts",recoveryAttempts);
    if(health.responses) cJSON_AddNumberToObject(object,"last_response_age_ms",(uint32_t)(millis()-health.lastResponse));
    else cJSON_AddNullToObject(object,"last_response_age_ms");
    if(health.tags) cJSON_AddNumberToObject(object,"last_tag_age_ms",(uint32_t)(millis()-health.lastTag));
    else cJSON_AddNullToObject(object,"last_tag_age_ms");
    String result=jsonEncode(object); cJSON_Delete(object); return result;
}

void handleUsbSetup(const String& frame) {
    const char* end=nullptr;
    cJSON* request=cJSON_ParseWithOpts(frame.c_str(),&end,true);
    String action;
    if(!cJSON_IsObject(request)||!jsonText(request,"action",action)) {
        cJSON_Delete(request);
        Serial.println(F("USB-SETUP {\"ok\":false,\"error\":\"Invalid request\"}")); return;
    }
    bool ok=true;
    String error;
    if(action=="profile_save"||action=="profile_delete") {
        String ssid;
        if(!jsonText(request,"wifi_ssid",ssid)) { ok=false; error="Wi-Fi name required"; }
        else if(action=="profile_delete") {
            if(ssid==config.wifiSsid) { ok=false; error="Cannot delete the active network; select another network first"; }
            else if(!wifiProfiles.remove(ssid)) { ok=false; error="Profile not found or storage failed"; }
        } else {
            DeviceConfiguration next;
            // Profile-only saves do not require an existing server identity.
            if(!usbCandidate(request,config,next)) {
                ok=false; error="Invalid network settings";
            } else if(next.wifiSsid==config.wifiSsid&&next.wifiPassword!=config.wifiPassword) {
                ok=false; error="Use Configure and connect to update the active network password";
            } else if(!wifiProfiles.save({next.wifiSsid,next.wifiPassword})) {
                ok=false; error="Invalid network settings, profile storage failed, or eight-profile limit reached";
            }
        }
    } else if(action=="provision"||action=="profile_select") {
        DeviceConfiguration next;
        bool valid=false;
        if(action=="profile_select") {
            String ssid; WifiProfile profile;
            valid=jsonText(request,"wifi_ssid",ssid)&&wifiProfiles.find(ssid,profile);
            next=config; next.wifiSsid=profile.ssid; next.wifiPassword=profile.password; next.rebaseNetwork=true;
        } else valid=usbCandidate(request,config,next);
        if(!valid||!configManager.validateConfiguration(next,true)) {
            ok=false; error="Invalid settings: check network password, HTTPS URL, device ID and secret";
        } else if(!wifiProfiles.canSave({next.wifiSsid,next.wifiPassword})) {
            ok=false; error="Profile storage unavailable or full; delete an unused profile first";
        } else {
            Serial.println(F("USB-SETUP {\"progress\":\"Verifying Wi-Fi and server\"}"));
            bool hadPortal=portal.active();
            portal.stop();
            ok=applyCandidate(next);
            if(ok) {
                automaticPortalOpened=false;
                WifiProfile saved;
                if(!wifiProfiles.find(config.wifiSsid,saved)||saved.password!=config.wifiPassword) {
                    ok=false; error="Active network was applied, but remembering its profile failed; inspect status";
                }
            }
            else {
                error="Setup not committed. Check Wi-Fi and server authentication; inspect status before retrying";
                if(hadPortal||!wifiManager.connected()) { startSetupMode(); automaticPortalOpened=true; }
            }
        }
    } else if(action!="status") { ok=false; error="Unknown action"; }
    cJSON_Delete(request);
    cJSON* response=cJSON_CreateObject();
    if(!response) { Serial.println(F("USB-SETUP {\"ok\":false,\"error\":\"Out of memory\"}")); return; }
    cJSON_AddBoolToObject(response,"ok",ok);
    cJSON_AddNumberToObject(response,"protocol",1);
    cJSON_AddStringToObject(response,"firmware",FIRMWARE_VERSION);
    cJSON_AddStringToObject(response,"device_id",config.deviceId.c_str());
    cJSON_AddStringToObject(response,"server_url",config.serverUrl.c_str());
    cJSON_AddStringToObject(response,"wifi_ssid",config.wifiSsid.c_str());
    cJSON_AddBoolToObject(response,"configured",configManager.validateConfiguration(config,true));
    cJSON_AddBoolToObject(response,"wifi_connected",wifiManager.connected());
    cJSON_AddBoolToObject(response,"reader_ready",scannerReady);
    cJSON_AddNumberToObject(response,"profile_capacity",WifiProfiles::capacity);
    cJSON* saved=cJSON_AddArrayToObject(response,"profiles");
    std::vector<WifiProfile> profiles;
    bool profilesOk=wifiProfiles.read(profiles);
    cJSON_AddBoolToObject(response,"profiles_available",profilesOk);
    if(profilesOk) for(const auto& profile:profiles) {
        cJSON* item=cJSON_CreateObject(); if(!item) continue;
        cJSON_AddStringToObject(item,"ssid",profile.ssid.c_str());
        cJSON_AddBoolToObject(item,"open_network",!profile.password.length());
        cJSON_AddBoolToObject(item,"active",profile.ssid==config.wifiSsid);
        cJSON_AddItemToArray(saved,item);
    }
    if(error.length()) cJSON_AddStringToObject(response,"error",error.c_str());
    Serial.print(F("USB-SETUP ")); Serial.println(jsonEncode(response)); cJSON_Delete(response);
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
    usbInput.poll(handleUsbSetup,[](char command) {
        if(command=='s') executeScan();
        else if(command=='d') Serial.printf("[CONFIG] Firmware %s mode=%s version=%lu reader=%s\n",FIRMWARE_VERSION,config.scanMode.c_str(),(unsigned long)config.configVersion,scannerReady?"ready":"not ready");
    });
    portal.loop(); wifiManager.loop(config);
    // Deliver scans before idle diagnostics, discovery, heartbeats and config fetches.
    // Successful batches drain without a retry delay; failures retain backoff.
    size_t queuedBeforeUpload=scanQueue.count();
    scanQueue.loop(apiClient,wifiManager.connected());
    if(scanQueue.count()>0&&scanQueue.count()<queuedBeforeUpload) { delay(2); return; }
    checkReaderWhileIdle();
    if (!portal.active() && wifiManager.connected()) apiClient.pollWifiScan();
    if(wifiManager.connected()) automaticPortalOpened=false;
    if(wifiManager.prolongedFailure()&&!automaticPortalOpened) { startSetupMode(); automaticPortalOpened=true; }
    if(wifiManager.connected()&&(millis()-lastHeartbeat>=config.heartbeatInterval*1000UL || (apiClient.wifiScanReady()&&millis()-lastHeartbeat>=10000UL))) {
        lastHeartbeat=millis(); uint32_t serverVersion=config.configVersion;
        // Complete local recovery/legacy upgrade before fetching dashboard Wi-Fi.
        if(config.rebaseNetwork&&!applyCandidate(config)) { delay(2); return; }
        if(apiClient.sendHeartbeat(millis()/1000,scannerReady,serverVersion,config.networkVersion,readerDiagnostics())&&serverVersion>config.configVersion) {
            DeviceConfiguration candidate=config;
            if(apiClient.fetchConfiguration(candidate)) applyCandidate(candidate);
            else Serial.println(F("[CONFIG] Download failed; version unchanged, retrying on next heartbeat."));
        }
    }
    delay(2);
}
