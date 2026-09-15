#include "../include/device_wifi_manager.h"
#include "../include/config.h"
#include <WiFi.h>
#include <time.h>
void DeviceWiFiManager::synchronizeClock(){if(_clockReady||!connected())return;configTime(0,0,"pool.ntp.org","time.cloudflare.com","time.google.com");uint32_t started=millis();time_t now=0;while(now<1704067200&&millis()-started<10000){delay(100);time(&now);}_clockReady=now>=1704067200;}
bool DeviceWiFiManager::connect(const DeviceConfiguration& c,uint32_t timeoutMs){if(!c.wifiSsid.length())return false;WiFi.persistent(false);WiFi.mode(WIFI_STA);WiFi.setAutoReconnect(false);WiFi.setTxPower(WIFI_POWER_13dBm);WiFi.begin(c.wifiSsid.c_str(),c.wifiPassword.c_str());uint32_t start=millis();while(WiFi.status()!=WL_CONNECTED&&millis()-start<timeoutMs)delay(50);if(connected()){_disconnectedSince=0;_backoff=WIFI_RECONNECT_MIN_MS;synchronizeClock();}else if(!_disconnectedSince)_disconnectedSince=millis();return connected();}
void DeviceWiFiManager::loop(const DeviceConfiguration& c){if(connected()){_disconnectedSince=0;_backoff=WIFI_RECONNECT_MIN_MS;synchronizeClock();return;}_clockReady=false;if(!_disconnectedSince)_disconnectedSince=millis();if(!c.autoReconnect||millis()-_lastAttempt<_backoff)return;_lastAttempt=millis();WiFi.disconnect();WiFi.begin(c.wifiSsid.c_str(),c.wifiPassword.c_str());_backoff=min(_backoff*2,(uint32_t)WIFI_RECONNECT_MAX_MS);}
bool DeviceWiFiManager::connected()const{return WiFi.status()==WL_CONNECTED;} bool DeviceWiFiManager::prolongedFailure()const{return _disconnectedSince&&millis()-_disconnectedSince>=WIFI_FAILURE_SETUP_MS;}
