#include "../include/config_manager.h"
#include <Preferences.h>
#include <WiFi.h>

static const char* NAMESPACE = "rfid-config";
static String nvsKey(bool pending, const char* name) { return String(pending ? "p_" : "a_") + name; }
bool ConfigManager::begin() { return true; }

bool ConfigManager::read(bool pending, DeviceConfiguration& c) {
    Preferences p; if (!p.begin(NAMESPACE, true)) return false;
    c.wifiSsid = p.getString(nvsKey(pending,"ssid").c_str(), "");
    c.wifiPassword = p.getString(nvsKey(pending,"pass").c_str(), "");
    c.serverUrl = p.getString(nvsKey(pending,"url").c_str(), "");
    c.deviceId = p.getString(nvsKey(pending,"id").c_str(), "");
    c.deviceToken = p.getString(nvsKey(pending,"token").c_str(), "");
    c.scanMode = p.getString(nvsKey(pending,"mode").c_str(), "single");
    c.rfPower = p.getUChar(nvsKey(pending,"power").c_str(), 20);
    c.scanTimeout = p.getUInt(nvsKey(pending,"scanms").c_str(), 3000);
    c.heartbeatInterval = p.getUInt(nvsKey(pending,"heart").c_str(), 30);
    c.buzzerEnabled = p.getBool(nvsKey(pending,"buzz").c_str(), true);
    c.autoReconnect = p.getBool(nvsKey(pending,"reconn").c_str(), true);
    c.configVersion = p.getUInt(nvsKey(pending,"ver").c_str(), 0);
    bool exists = p.getBool(nvsKey(pending,"valid").c_str(), false); p.end(); return exists;
}

bool ConfigManager::write(bool pending, const DeviceConfiguration& c) {
    if (!validateConfiguration(c, false)) return false;
    Preferences p; if (!p.begin(NAMESPACE, false)) return false;
    p.putString(nvsKey(pending,"ssid").c_str(), c.wifiSsid); p.putString(nvsKey(pending,"pass").c_str(), c.wifiPassword);
    p.putString(nvsKey(pending,"url").c_str(), c.serverUrl); p.putString(nvsKey(pending,"id").c_str(), c.deviceId);
    p.putString(nvsKey(pending,"token").c_str(), c.deviceToken); p.putString(nvsKey(pending,"mode").c_str(), c.scanMode);
    p.putUChar(nvsKey(pending,"power").c_str(), c.rfPower); p.putUInt(nvsKey(pending,"scanms").c_str(), c.scanTimeout);
    p.putUInt(nvsKey(pending,"heart").c_str(), c.heartbeatInterval); p.putBool(nvsKey(pending,"buzz").c_str(), c.buzzerEnabled);
    p.putBool(nvsKey(pending,"reconn").c_str(), c.autoReconnect); p.putUInt(nvsKey(pending,"ver").c_str(), c.configVersion);
    p.putBool(nvsKey(pending,"valid").c_str(), true); p.end(); return true;
}

bool ConfigManager::loadConfiguration(DeviceConfiguration& c) { return read(false,c); }
bool ConfigManager::loadPendingConfiguration(DeviceConfiguration& c) { return read(true,c); }
bool ConfigManager::saveConfiguration(const DeviceConfiguration& c) { return write(false,c); }
bool ConfigManager::savePendingConfiguration(const DeviceConfiguration& c) { return write(true,c); }
bool ConfigManager::commitPendingConfiguration(DeviceConfiguration& c) { DeviceConfiguration p; if (!read(true,p) || !write(false,p)) return false; c=p; rollbackPendingConfiguration(); return true; }

void ConfigManager::rollbackPendingConfiguration() {
    Preferences p; if (!p.begin(NAMESPACE, false)) return;
    const char* names[]={"ssid","pass","url","id","token","mode","power","scanms","heart","buzz","reconn","ver","valid"};
    for (const char* name:names) p.remove(nvsKey(true,name).c_str()); p.end();
}
bool ConfigManager::hasPendingConfiguration() { Preferences p; if(!p.begin(NAMESPACE,true)) return false; bool v=p.getBool("p_valid",false); p.end(); return v; }
bool ConfigManager::validateConfiguration(const DeviceConfiguration& c, bool requireNetwork) const {
    bool modeOk=c.scanMode=="single"||c.scanMode=="inventory"; bool urlOk=c.serverUrl.startsWith("https://")||c.serverUrl.startsWith("http://");
    return c.deviceId.length()>0&&c.deviceToken.length()>0&&urlOk&&(!requireNetwork||(c.wifiSsid.length()>0&&c.wifiSsid.length()<=32))&&modeOk&&c.rfPower<=26&&c.scanTimeout>=100&&c.scanTimeout<=30000&&c.heartbeatInterval>=10&&c.heartbeatInterval<=3600;
}
bool ConfigManager::applyConfiguration(const DeviceConfiguration& c) const { return validateConfiguration(c,true); }
void ConfigManager::resetConfiguration(bool preserveIdentity) { DeviceConfiguration old; loadConfiguration(old); Preferences p; if(p.begin(NAMESPACE,false)){p.clear();p.end();} if(preserveIdentity&&old.deviceId.length()){DeviceConfiguration clean;clean.deviceId=old.deviceId;clean.deviceToken=old.deviceToken;clean.serverUrl=old.serverUrl.length()?old.serverUrl:"https://example.invalid";saveConfiguration(clean);} }
String ConfigManager::generateDeviceId() { uint64_t chip=ESP.getEfuseMac(); char id[24]; snprintf(id,sizeof(id),"RFID-HH-%06llX",(unsigned long long)(chip&0xFFFFFF)); return String(id); }
