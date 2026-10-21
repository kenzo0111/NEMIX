#pragma once
#include "config_json.h"
#include <Preferences.h>
#include <vector>

struct WifiProfile { String ssid, password; };

class WifiProfiles {
    static bool valid(const WifiProfile& profile) {
        if(!profile.ssid.length()||profile.ssid.length()>32||profile.password.length()>63||
           (profile.password.length()&&profile.password.length()<8)) return false;
        for(size_t i=0;i<profile.password.length();++i)
            if((unsigned char)profile.password[i]<32||(unsigned char)profile.password[i]>126) return false;
        return true;
    }
    bool write(const std::vector<WifiProfile>& profiles) {
        cJSON* array=cJSON_CreateArray(); if(!array) return false;
        for(const auto& profile:profiles) {
            cJSON* item=cJSON_CreateObject();
            if(!item) { cJSON_Delete(array); return false; }
            cJSON_AddStringToObject(item,"ssid",profile.ssid.c_str());
            cJSON_AddStringToObject(item,"password",profile.password.c_str());
            cJSON_AddItemToArray(array,item);
        }
        String encoded=jsonEncode(array); cJSON_Delete(array);
        Preferences preferences; if(!encoded.length()||!preferences.begin("rfid-config",false)) return false;
        bool ok=preferences.putString("wifi_profiles",encoded)==encoded.length()&&preferences.getString("wifi_profiles","")==encoded;
        preferences.end(); return ok;
    }
public:
    static constexpr size_t capacity=8;
    bool read(std::vector<WifiProfile>& profiles) {
        profiles.clear(); Preferences preferences;
        // Opening read/write creates the namespace on a fresh board.
        if(!preferences.begin("rfid-config",false)) return false;
        String encoded=preferences.getString("wifi_profiles","[]"); preferences.end();
        cJSON* array=cJSON_Parse(encoded.c_str());
        bool ok=cJSON_IsArray(array)&&cJSON_GetArraySize(array)<=capacity;
        if(ok) for(const cJSON* item=array->child;item;item=item->next) {
            WifiProfile profile;
            if(!jsonText(item,"ssid",profile.ssid)||!jsonText(item,"password",profile.password)||!valid(profile)) { ok=false; break; }
            for(const auto& previous:profiles) if(previous.ssid==profile.ssid) ok=false;
            if(!ok) break;
            profiles.push_back(profile);
        }
        cJSON_Delete(array); if(!ok) profiles.clear(); return ok;
    }
    bool canSave(const WifiProfile& profile) {
        std::vector<WifiProfile> profiles;
        if(!valid(profile)||!read(profiles)) return false;
        for(const auto& saved:profiles) if(saved.ssid==profile.ssid) return true;
        return profiles.size()<capacity;
    }
    bool save(const WifiProfile& profile) {
        std::vector<WifiProfile> profiles;
        if(!valid(profile)||!read(profiles)) return false;
        for(auto& saved:profiles) if(saved.ssid==profile.ssid) {
            if(saved.password==profile.password) return true;
            saved=profile; return write(profiles);
        }
        if(profiles.size()>=capacity) return false;
        profiles.push_back(profile); return write(profiles);
    }
    bool find(const String& ssid,WifiProfile& profile) {
        std::vector<WifiProfile> profiles; if(!read(profiles)) return false;
        for(const auto& saved:profiles) if(saved.ssid==ssid) { profile=saved; return true; }
        return false;
    }
    bool remove(const String& ssid) {
        std::vector<WifiProfile> profiles; if(!read(profiles)) return false;
        for(auto it=profiles.begin();it!=profiles.end();++it) if(it->ssid==ssid) {
            profiles.erase(it); return write(profiles);
        }
        return false;
    }
};
