#pragma once
#include "api_client.h"
#include "yrm100.h"
#include <Preferences.h>
#include "config_json.h"

class ScanQueue {
    struct Event { String epc,id; int rssi; };
    std::vector<Event> events;
    uint32_t lastAttempt=0,backoff=2000;
    bool dirty=false,healthy=true;
    static uint8_t hexValue(char c) {
        if(c>='0'&&c<='9') return c-'0';
        if(c>='A'&&c<='F') return c-'A'+10;
        return c-'a'+10;
    }
    static String toHex(const uint8_t* bytes,size_t length) {
        const char* digits="0123456789abcdef"; String result; result.reserve(length*2);
        for(size_t i=0;i<length;++i) { result+=digits[bytes[i]>>4]; result+=digits[bytes[i]&15]; }
        return result;
    }
    bool persist() {
        // Compact record: schema/count, then EPC length/data, 16-byte event ID, RSSI.
        // Even 100 maximum-length EPCs use less than 7 KB of the 20 KB NVS partition.
        std::vector<uint8_t> bytes{1,(uint8_t)events.size()};
        for(const auto& event:events) {
            bytes.push_back(event.epc.length()/2);
            for(size_t i=0;i<event.epc.length();i+=2) bytes.push_back((hexValue(event.epc[i])<<4)|hexValue(event.epc[i+1]));
            for(size_t i=0;i<32;i+=2) bytes.push_back((hexValue(event.id[i])<<4)|hexValue(event.id[i+1]));
            bytes.push_back((uint8_t)(int8_t)event.rssi);
        }
        Preferences p; if(!p.begin("rfid-delivery",false)) return false;
        // NVS strings are limited to one page. Inventory queues must use a blob.
        bool ok=p.putBytes("queue_blob",bytes.data(),bytes.size())==bytes.size();
        std::vector<uint8_t> readback(bytes.size());
        ok=ok&&p.getBytes("queue_blob",readback.data(),readback.size())==readback.size()&&readback==bytes;
        p.end(); if(ok) dirty=false; return ok;
    }
public:
    void begin() {
        Preferences p; if(!p.begin("rfid-delivery",true)) return;
        size_t length=p.getBytesLength("queue_blob");
        if(!p.isKey("queue_blob")) { p.end(); return; }
        if(length<2||length>6802) { healthy=false; p.end(); return; }
        std::vector<uint8_t> bytes(length);
        bool loaded=p.getBytes("queue_blob",bytes.data(),length)==length; p.end();
        if(!loaded||bytes[0]!=1||bytes[1]>100) { healthy=false; return; }
        size_t offset=2;
        for(size_t i=0;i<bytes[1];++i) {
            if(offset>=length) { healthy=false; break; }
            size_t epcLength=bytes[offset++];
            if(!epcLength||epcLength>50||offset+epcLength+17>length) { healthy=false; break; }
            Event event; event.epc=toHex(bytes.data()+offset,epcLength); event.epc.toUpperCase(); offset+=epcLength;
            event.id=toHex(bytes.data()+offset,16); offset+=16;
            event.rssi=(int8_t)bytes[offset++];
            if(event.rssi<-127||event.rssi>0) { healthy=false; break; }
            events.push_back(event);
        }
        if(offset!=length) healthy=false;
        if(!healthy) Serial.println(F("[QUEUE] Invalid saved queue; local storage recovery required."));
    }
    bool enqueue(const std::vector<RfidTag>& tags) {
        if(events.size()+tags.size()>100) { Serial.println(F("[QUEUE] Full: deliver pending scans before scanning again.")); return false; }
        for(const auto& tag:tags) {
            char id[33]; snprintf(id,sizeof(id),"%08lX%08lX%08lX%08lX",(unsigned long)esp_random(),(unsigned long)esp_random(),(unsigned long)esp_random(),(unsigned long)esp_random());
            String eventId=id; eventId.toLowerCase(); events.push_back({tag.epc,eventId,tag.rssiDbm});
        }
        dirty=true; return persist();
    }
    size_t availableSlots() const { return dirty||!healthy ? 0 : 100-events.size(); }
    bool canScan() const { return availableSlots()>0; }
    void loop(NemixApiClient& api,bool connected) {
        if(!healthy||(events.empty()&&!dirty)||millis()-lastAttempt<backoff) return;
        lastAttempt=millis();
        if(dirty&&!persist()) Serial.println(F("[QUEUE] Save failed; keeping scans in RAM and retrying delivery. Keep device powered."));
        if(!connected||events.empty()) return;
        size_t count=min((size_t)20,events.size());
        cJSON* object=cJSON_CreateObject(); if(!object) return;
        cJSON* array=cJSON_AddArrayToObject(object,"scans");
        for(size_t i=0;i<count;++i) {
            cJSON* event=cJSON_CreateObject();
            cJSON_AddStringToObject(event,"epc",events[i].epc.c_str());
            cJSON_AddStringToObject(event,"event_uuid",events[i].id.c_str());
            cJSON_AddNumberToObject(event,"rssi",events[i].rssi); cJSON_AddItemToArray(array,event);
        }
        String body=jsonEncode(object); cJSON_Delete(object);
        if(api.submitScans(body,count)) {
            events.erase(events.begin(),events.begin()+count); dirty=true; persist(); backoff=2000;
        } else backoff=min(backoff*2,(uint32_t)60000);
    }
};
