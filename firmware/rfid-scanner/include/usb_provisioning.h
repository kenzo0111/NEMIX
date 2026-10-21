#pragma once
#include "config_json.h"

// USB requests start with 'u' and end with LF. Discard malformed/oversized
// frames as a whole so their contents never execute legacy scan commands.
class UsbProvisioningInput {
    String frame;
    bool receiving=false, discarding=false;
    uint32_t started=0;
public:
    template<typename Handler, typename Legacy> void poll(Handler handler, Legacy legacy) {
        // Networking may block the idle loop; consume buffered bytes first.
        if(receiving && !discarding && !Serial.available() && millis()-started>10000) {
            frame=""; discarding=true;
            Serial.println(F("USB-SETUP {\"ok\":false,\"error\":\"Request timed out\"}"));
        }
        while(Serial.available()) {
            char ch=Serial.read();
            if(!receiving) {
                if(ch=='u') { receiving=true; started=millis(); }
                else legacy(ch);
                continue;
            }
            if(ch=='\n') {
                if(!discarding) handler(frame);
                frame=""; receiving=false; discarding=false;
            } else if(!discarding && ch!='\r') {
                if(ch==0 || frame.length()>=1024) {
                    frame=""; discarding=true;
                    Serial.println(F("USB-SETUP {\"ok\":false,\"error\":\"Invalid or oversized request\"}"));
                } else frame+=ch;
            }
        }
    }
};

inline bool usbPrintable(const String& value) {
    for(size_t i=0;i<value.length();++i)
        if((unsigned char)value[i]<32 || (unsigned char)value[i]>126) return false;
    return true;
}

inline bool usbCandidate(const cJSON* request, const DeviceConfiguration& current, DeviceConfiguration& next) {
    next=current;
    if(!jsonText(request,"wifi_ssid",next.wifiSsid)) return false;
    bool open=false;
    if(cJSON_HasObjectItem(request,"open_network") && !jsonFlag(request,"open_network",open)) return false;
    String password;
    bool hasPassword=cJSON_HasObjectItem(request,"wifi_password");
    if(hasPassword && !jsonText(request,"wifi_password",password)) return false;
    if(open) { if(password.length()) return false; next.wifiPassword=""; }
    else if(password.length()) next.wifiPassword=password;
    else if(next.wifiSsid!=current.wifiSsid || !current.wifiPassword.length()) return false;
    if(cJSON_HasObjectItem(request,"server_url") && !jsonText(request,"server_url",next.serverUrl)) return false;
    while(next.serverUrl.endsWith("/")) next.serverUrl.remove(next.serverUrl.length()-1);
    if(cJSON_HasObjectItem(request,"device_id") && !jsonText(request,"device_id",next.deviceId)) return false;
    if(cJSON_HasObjectItem(request,"device_token")) {
        String token;
        if(!jsonText(request,"device_token",token)) return false;
        if(token.length()) next.deviceToken=token;
    }
    next.rebaseNetwork=true;
    return usbPrintable(next.wifiPassword) && usbPrintable(next.deviceToken);
}
