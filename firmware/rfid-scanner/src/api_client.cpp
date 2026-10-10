#include "../include/api_client.h"
#include "../include/config.h"
#include "../include/tls_roots.h"
#include <WiFiClientSecure.h>
#include <ctype.h>
#include <mbedtls/md.h>
#include <mbedtls/sha256.h>
#include <time.h>
#include "../include/config_json.h"

static String hexBytes(const unsigned char* bytes, size_t length) {
    const char* digits = "0123456789abcdef";
    String result;
    result.reserve(length * 2);
    for (size_t i = 0; i < length; ++i) {
        result += digits[bytes[i] >> 4];
        result += digits[bytes[i] & 15];
    }
    return result;
}

NemixApiClient::NemixApiClient() {}
void NemixApiClient::configure(const DeviceConfiguration& c){_baseUrl=c.serverUrl;_deviceId=c.deviceId;_token=c.deviceToken;}
bool NemixApiClient::checkWifi(){return WiFi.status()==WL_CONNECTED;}
int NemixApiClient::request(const String& method,const String& path,const String& json,String& response){
    if(!checkWifi()){Serial.println(F("[API] ERROR: Request skipped because Wi-Fi is disconnected."));return 0;}
    if(!_baseUrl.startsWith("https://")){Serial.println(F("[API] ERROR: HTTPS server URL required."));return 0;}
    time_t now = time(nullptr);
    if (now < 1700000000 || !_deviceId.length() || !_token.length()) {
        Serial.println(F("[API] ERROR: Clock or device identity unavailable."));return 0;
    }
    HTTPClient http;WiFiClientSecure secure;bool begun=false;String url=_baseUrl+path;
    secure.setCACert(API_TLS_ROOTS);secure.setHandshakeTimeout(15);begun=http.begin(secure,url);
    if(!begun){Serial.printf("[API] ERROR: Could not initialize %s.\n",path.c_str());return 0;}
    http.setTimeout(5000);http.addHeader("Accept","application/json");http.addHeader("Content-Type","application/json");
    unsigned char nonceBytes[16];
    for (int i = 0; i < 16; i += 4) {
        uint32_t value = esp_random();
        memcpy(nonceBytes + i, &value, 4);
    }
    String nonce = hexBytes(nonceBytes, sizeof(nonceBytes));
    String timestamp = String((unsigned long)now);
    unsigned char bodyDigest[32];
    mbedtls_sha256((const unsigned char*)json.c_str(), json.length(), bodyDigest, 0);
    String canonical = timestamp + "\n" + nonce + "\n" + method + "\n" + path + "\n" + hexBytes(bodyDigest, sizeof(bodyDigest));
    unsigned char signature[32];
    const mbedtls_md_info_t* sha256 = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);
    if (!sha256 || mbedtls_md_hmac(sha256, (const unsigned char*)_token.c_str(), _token.length(),
        (const unsigned char*)canonical.c_str(), canonical.length(), signature) != 0) {
        http.end();return 0;
    }
    http.addHeader("X-Device-ID",_deviceId);
    http.addHeader("X-Timestamp",timestamp);
    http.addHeader("X-Nonce",nonce);
    http.addHeader("X-Signature",hexBytes(signature,sizeof(signature)));
    int code=method=="GET"?http.GET():http.POST(json);
    if(code>0){response=http.getString();Serial.printf("[API] %s %s -> HTTP %d\n",method.c_str(),path.c_str(),code);}
    else{
        char tlsError[160]={0};secure.lastError(tlsError,sizeof(tlsError));
        Serial.printf("[API] ERROR: %s %s failed: %s; TLS: %s\n",method.c_str(),path.c_str(),http.errorToString(code).c_str(),tlsError[0]?tlsError:"no TLS detail");
    }
    http.end();return code;
}

ItemLookupResult NemixApiClient::submitScan(const String& epc,int rssi) {
    ItemLookupResult result{false,0,false,""};
    cJSON* object=cJSON_CreateObject(); if(!object) return result;
    cJSON_AddStringToObject(object,"epc",epc.c_str()); cJSON_AddNumberToObject(object,"rssi",rssi);
    result.httpCode=request("POST",API_SCAN_PATH,jsonEncode(object),result.rawJson); cJSON_Delete(object);
    cJSON* response=cJSON_Parse(result.rawJson.c_str());
    result.success=(result.httpCode==200||result.httpCode==404)&&cJSON_IsTrue(cJSON_GetObjectItemCaseSensitive(response,"success"));
    result.found=result.success&&result.httpCode==200; cJSON_Delete(response); return result;
}

bool NemixApiClient::sendHeartbeat(uint32_t uptime,bool ready,uint32_t& version) {
    cJSON* object=cJSON_CreateObject(); if(!object) return false;
    cJSON_AddStringToObject(object,"firmware_version",FIRMWARE_VERSION);
    cJSON_AddStringToObject(object,"ip_address",WiFi.localIP().toString().c_str());
    cJSON_AddNumberToObject(object,"configuration_version",version);
    cJSON_AddNumberToObject(object,"wifi_rssi",WiFi.RSSI()); cJSON_AddNumberToObject(object,"uptime",uptime);
    cJSON_AddBoolToObject(object,"scanner_ready",ready);
    String body=jsonEncode(object), response; cJSON_Delete(object);
    if(request("POST",API_HEARTBEAT_PATH,body,response)!=200) return false;
    cJSON* parsed=cJSON_Parse(response.c_str());
    bool ok=cJSON_IsTrue(cJSON_GetObjectItemCaseSensitive(parsed,"success"))&&jsonUInt(parsed,"server_configuration_version",version);
    cJSON_Delete(parsed); return ok;
}

bool NemixApiClient::fetchConfiguration(DeviceConfiguration& c) {
    String response; if(request("POST",API_CANDIDATE_PATH,"{}",response)!=200) return false;
    cJSON* parsed=cJSON_Parse(response.c_str());
    const cJSON* object=cJSON_GetObjectItemCaseSensitive(parsed,"configuration");
    DeviceConfiguration candidate=c; bool networkAvailable=false;
    bool valid=cJSON_IsTrue(cJSON_GetObjectItemCaseSensitive(parsed,"success")) &&
        parseScannerSettings(object,candidate)&&candidate.configVersion>c.configVersion&&
        jsonFlag(object,"network_available",networkAvailable);
    if(valid&&networkAvailable) {
        valid=jsonText(object,"wifi_ssid",candidate.wifiSsid);
        const cJSON* password=cJSON_GetObjectItemCaseSensitive(object,"wifi_password");
        if(cJSON_IsString(password)) candidate.wifiPassword=password->valuestring;
        else if(!cJSON_IsNull(password)) valid=false;
    }
    cJSON_Delete(parsed);
    if(valid) c=candidate;
    return valid;
}

// Kept for legacy callers; new firmware downloads one complete candidate snapshot.
bool NemixApiClient::fetchNetworkConfiguration(DeviceConfiguration&,uint32_t) { return false; }

bool NemixApiClient::verifyConnection(uint32_t expectedVersion) {
    String response; if(request("GET",API_CONFIG_PATH,"",response)!=200) return false;
    cJSON* parsed=cJSON_Parse(response.c_str());
    uint32_t serverVersion=0;
    bool ok=cJSON_IsTrue(cJSON_GetObjectItemCaseSensitive(parsed,"success"))&&
        jsonUInt(cJSON_GetObjectItemCaseSensitive(parsed,"configuration"),"version",serverVersion)&&serverVersion>=expectedVersion;
    cJSON_Delete(parsed); return ok;
}

bool NemixApiClient::reportConfigurationStatus(uint32_t version,const char* status,const String& message) {
    cJSON* object=cJSON_CreateObject(); if(!object) return false;
    cJSON_AddNumberToObject(object,"version",version); cJSON_AddStringToObject(object,"status",status);
    cJSON_AddStringToObject(object,"message",message.c_str()); String body=jsonEncode(object), response;
    cJSON_Delete(object); return request("POST",API_CONFIG_STATUS_PATH,body,response)==200;
}

bool NemixApiClient::submitScans(const String& body,size_t expectedCount) {
    String response; if(request("POST",API_SCANS_PATH,body,response)!=200) return false;
    cJSON* parsed=cJSON_Parse(response.c_str()); cJSON* sent=cJSON_Parse(body.c_str());
    const cJSON* accepted=cJSON_GetObjectItemCaseSensitive(parsed,"accepted");
    const cJSON* scans=cJSON_GetObjectItemCaseSensitive(sent,"scans");
    bool ok=cJSON_IsTrue(cJSON_GetObjectItemCaseSensitive(parsed,"success"))&&cJSON_IsArray(accepted)&&
        cJSON_GetArraySize(accepted)==(int)expectedCount;
    for(size_t i=0;ok&&i<expectedCount;++i) {
        const cJSON* id=cJSON_GetArrayItem(accepted,i);
        const cJSON* original=cJSON_GetObjectItemCaseSensitive(cJSON_GetArrayItem(scans,i),"event_uuid");
        ok=cJSON_IsString(id)&&cJSON_IsString(original)&&strcmp(id->valuestring,original->valuestring)==0;
    }
    cJSON_Delete(parsed); cJSON_Delete(sent); return ok;
}
