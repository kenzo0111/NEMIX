#include "../include/api_client.h"
#include "../include/config.h"
#include "../include/tls_roots.h"
#include <WiFiClientSecure.h>
#include <ctype.h>

NemixApiClient::NemixApiClient() {}
void NemixApiClient::configure(const DeviceConfiguration& c){_baseUrl=c.serverUrl;_deviceId=c.deviceId;_token=c.deviceToken;}
bool NemixApiClient::checkWifi(){return WiFi.status()==WL_CONNECTED;}
int NemixApiClient::request(const String& method,const String& path,const String& json,String& response){
    if(!checkWifi()){Serial.println(F("[API] ERROR: Request skipped because Wi-Fi is disconnected."));return 0;}
    if(!_baseUrl.length()){Serial.println(F("[API] ERROR: Server URL is empty."));return 0;}
    HTTPClient http;WiFiClientSecure secure;bool begun=false;String url=_baseUrl+path;
    if(url.startsWith("https://")){
        secure.setCACert(API_TLS_ROOTS);secure.setHandshakeTimeout(15);begun=http.begin(secure,url);
    }else begun=http.begin(url);
    if(!begun){Serial.printf("[API] ERROR: Could not initialize %s.\n",path.c_str());return 0;}
    http.setTimeout(12000);http.addHeader("Accept","application/json");http.addHeader("Content-Type","application/json");
    http.addHeader("X-Device-ID",_deviceId);http.addHeader("X-Hardware-Token",_token);
    int code=method=="GET"?http.GET():http.POST(json);
    if(code>0){response=http.getString();Serial.printf("[API] %s %s -> HTTP %d\n",method.c_str(),path.c_str(),code);}
    else{
        char tlsError[160]={0};secure.lastError(tlsError,sizeof(tlsError));
        Serial.printf("[API] ERROR: %s %s failed: %s; TLS: %s\n",method.c_str(),path.c_str(),http.errorToString(code).c_str(),tlsError[0]?tlsError:"no TLS detail");
    }
    http.end();return code;
}
String NemixApiClient::jsonString(const String& j,const char* key,const String& fallback){String n="\""+String(key)+"\"";int p=j.indexOf(n);if(p<0)return fallback;p=j.indexOf(':',p+n.length());if(p<0)return fallback;p++;while(p<j.length()&&isspace((unsigned char)j[p]))p++;if(p>=j.length()||j[p]!='"')return fallback;int e=j.indexOf('"',p+1);if(e<0)return fallback;String val=j.substring(p+1,e);val.replace("\\/","/");return val;}
long NemixApiClient::jsonLong(const String& j,const char* key,long fallback){String n="\""+String(key)+"\"";int p=j.indexOf(n);if(p<0)return fallback;p=j.indexOf(':',p+n.length())+1;while(p<j.length()&&isspace((unsigned char)j[p]))p++;int e=p;while(e<j.length()&&(isdigit((unsigned char)j[e])||j[e]=='-'))e++;return e==p?fallback:j.substring(p,e).toInt();}
bool NemixApiClient::jsonBool(const String& j,const char* key,bool fallback){String n="\""+String(key)+"\"";int p=j.indexOf(n);if(p<0)return fallback;p=j.indexOf(':',p+n.length())+1;while(p<j.length()&&isspace((unsigned char)j[p]))p++;if(j.substring(p,p+4)=="true")return true;if(j.substring(p,p+5)=="false")return false;return fallback;}
ItemLookupResult NemixApiClient::submitScan(const String& epc,int rssi){ItemLookupResult r{false,0,false,""};String body="{\"epc\":\""+epc+"\",\"rssi\":"+String(rssi)+"}";r.httpCode=request("POST",API_SCAN_PATH,body,r.rawJson);r.success=r.httpCode>0;r.found=r.httpCode==200;return r;}
bool NemixApiClient::sendHeartbeat(uint32_t uptime,bool ready,uint32_t& version){String response;String body="{\"firmware_version\":\"" FIRMWARE_VERSION "\",\"ip_address\":\""+WiFi.localIP().toString()+"\",\"configuration_version\":"+String(version)+",\"wifi_rssi\":"+String(WiFi.RSSI())+",\"uptime\":"+String(uptime)+",\"scanner_ready\":"+(ready?"true":"false")+"}";if(request("POST",API_HEARTBEAT_PATH,body,response)!=200)return false;version=(uint32_t)jsonLong(response,"server_configuration_version",version);return true;}
bool NemixApiClient::fetchConfiguration(DeviceConfiguration& c){String response;if(request("GET",API_CONFIG_PATH,"",response)!=200)return false;long version=jsonLong(response,"version",c.configVersion);if(version<=(long)c.configVersion)return false;c.serverUrl=jsonString(response,"server_url",c.serverUrl);c.scanMode=jsonString(response,"scan_mode",c.scanMode);c.rfPower=(uint8_t)jsonLong(response,"rf_power",c.rfPower);c.scanTimeout=(uint32_t)jsonLong(response,"scan_timeout",c.scanTimeout);c.heartbeatInterval=(uint32_t)jsonLong(response,"heartbeat_interval",c.heartbeatInterval);c.buzzerEnabled=jsonBool(response,"buzzer_enabled",c.buzzerEnabled);c.autoReconnect=jsonBool(response,"auto_reconnect",c.autoReconnect);c.configVersion=(uint32_t)version;return true;}
bool NemixApiClient::fetchNetworkConfiguration(DeviceConfiguration& c,uint32_t currentVersion){String response;String body="{\"current_version\":"+String(currentVersion)+"}";if(request("POST",API_NETWORK_CONFIG_PATH,body,response)!=200||!jsonBool(response,"configuration_available",false))return false;String remoteSsid=jsonString(response,"wifi_ssid","");String remotePassword=jsonString(response,"wifi_password","");if(!remoteSsid.length()){Serial.println(F("[CONFIG] Server Wi-Fi is blank; preserving locally provisioned network."));return false;}c.wifiSsid=remoteSsid;if(remotePassword.length())c.wifiPassword=remotePassword;return true;}
bool NemixApiClient::reportConfigurationStatus(uint32_t version,const char* status,const String& message){String response;String body="{\"version\":"+String(version)+",\"status\":\""+String(status)+"\",\"message\":\""+message+"\"}";return request("POST",API_CONFIG_STATUS_PATH,body,response)==200;}
