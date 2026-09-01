#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <HTTPClient.h>

constexpr int PIN_LDR=34, PIN_IR_EMITTER=25, PIN_BUZZER=26;
const char* WIFI_SSID="YOUR_WIFI_SSID";
const char* WIFI_PASSWORD="YOUR_WIFI_PASSWORD";
 // IMPORTANT: this must point to the Cloudflare Worker /notify endpoint, NOT the GitHub Pages website.
const char* NOTIFY_URL="https://reactance-i.jhostins099.workers.dev/notify"; // IMPORTANT: this must point to the Cloudflare Worker /notify endpoint, NOT the GitHub Pages website.
const char* NOTIFY_DEVICE_KEY="YOUR_REACTANCE_DEVICE_KEY";
WebServer server(80); Preferences prefs;

enum SystemMode:uint8_t{OFF,ARMED_LOUD,ARMED_SILENT};
enum EventType:uint8_t{EVT_BOOT,EVT_ARM,EVT_DISARM,EVT_MODE,EVT_LASER_ON,EVT_LASER_OFF,EVT_BEAM_BREAK,EVT_BEAM_RESTORE,EVT_ALARM_ON,EVT_ALARM_OFF,EVT_NOTIFY};
SystemMode mode=OFF; bool laserCommandedOn=false,beamDetected=false,previousBeamDetected=false,alarmActive=false;
unsigned long bootMs=0,lastSampleMs=0,lastTriggerMs=0; uint32_t triggerCount=0,activationCount=0,deactivationCount=0; int baseline=0;
struct EventRecord{uint32_t seconds;uint8_t type;int value;}; constexpr size_t MAX_EVENTS=80; EventRecord events[MAX_EVENTS]; size_t eventCount=0,eventHead=0;

void cors(){server.sendHeader("Access-Control-Allow-Origin","*");server.sendHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");server.sendHeader("Access-Control-Allow-Headers","Content-Type");}
void respond(int code,const String& body){cors();server.send(code,"application/json",body);}
void logEvent(EventType t,int v=0){events[eventHead]={(uint32_t)((millis()-bootMs)/1000UL),(uint8_t)t,v};eventHead=(eventHead+1)%MAX_EVENTS;if(eventCount<MAX_EVENTS)eventCount++;}
void persist(){prefs.putUInt("triggers",triggerCount);prefs.putUInt("activations",activationCount);prefs.putUInt("deactivations",deactivationCount);}

void irMark(uint32_t us){uint32_t start=micros();while(micros()-start<us){digitalWrite(PIN_IR_EMITTER,LOW);delayMicroseconds(13);digitalWrite(PIN_IR_EMITTER,HIGH);delayMicroseconds(13);}}
void irSpace(uint32_t us){digitalWrite(PIN_IR_EMITTER,HIGH);delayMicroseconds(us);}
void sendIR(uint8_t command){irMark(9000);irSpace(4500);uint8_t bytes[4]={0x00,0xFF,command,(uint8_t)~command};for(uint8_t b:bytes)for(uint8_t i=0;i<8;i++){irMark(560);irSpace((b&(1<<i))?1690:560);}irMark(560);irSpace(560);digitalWrite(PIN_IR_EMITTER,HIGH);}
void commandLaser(bool on){laserCommandedOn=on;sendIR(on?0xA1:0xA0);logEvent(on?EVT_LASER_ON:EVT_LASER_OFF);}
String modeName(){return mode==ARMED_LOUD?"ARMED_LOUD":mode==ARMED_SILENT?"ARMED_SILENT":"OFF";}
String statusJson(){String s="{";s+="\"system\":\""+(mode==OFF?String("OFF"):String("ARMED"))+"\",";s+="\"mode\":\""+modeName()+"\",";s+="\"laser\":"+(laserCommandedOn?String("true"):String("false"))+",";s+="\"beam\":"+(beamDetected?String("true"):String("false"))+",";s+="\"alarm\":"+(alarmActive?String("true"):String("false"))+",";s+="\"ldr\":"+String(analogRead(PIN_LDR))+",";s+="\"baseline\":"+String(baseline)+",";s+="\"triggers\":"+String(triggerCount)+",";s+="\"activations\":"+String(activationCount)+",";s+="\"deactivations\":"+String(deactivationCount)+",";s+="\"uptime_s\":"+String((millis()-bootMs)/1000UL)+"}";return s;}
void notifyEvent(const String& msg){if(strlen(NOTIFY_URL)==0||strlen(NOTIFY_DEVICE_KEY)==0)return;HTTPClient http;if(!http.begin(NOTIFY_URL))return;http.addHeader("Content-Type","application/json");http.addHeader("Authorization",String("Bearer ")+NOTIFY_DEVICE_KEY);String body="{\"event\":\"BEAM_INTERRUPTED\",\"systemState\":\"ARMED\",\"mode\":\"SILENT\",\"laserStatus\":\"ACTIVE\",\"beamStatus\":\"INTERRUPTED\",\"triggerCount\":"+String(triggerCount)+",\"message\":\"";for(size_t i=0;i<msg.length();i++){char c=msg[i];if(c=='\\'||c=='\"')body+='\\';body+=c;}body+="\"}";int code=http.POST(body);http.end();if(code>=200&&code<300)logEvent(EVT_NOTIFY,code);}
void setMode(SystemMode m){if(mode==m)return;if(m==OFF){mode=OFF;commandLaser(false);digitalWrite(PIN_BUZZER,LOW);alarmActive=false;deactivationCount++;logEvent(EVT_DISARM);}else{mode=m;activationCount++;logEvent(EVT_ARM,(int)m);commandLaser(true);delay(300);baseline=analogRead(PIN_LDR);previousBeamDetected=false;}persist();}
void evaluateBeam(){int reading=analogRead(PIN_LDR);if(mode==OFF){beamDetected=false;previousBeamDetected=false;return;}int threshold=max(30,baseline/4);beamDetected=reading>threshold;if(beamDetected!=previousBeamDetected){if(!beamDetected){triggerCount++;lastTriggerMs=millis();logEvent(EVT_BEAM_BREAK,reading);if(mode==ARMED_LOUD){alarmActive=true;digitalWrite(PIN_BUZZER,HIGH);logEvent(EVT_ALARM_ON);}else if(mode==ARMED_SILENT){notifyEvent("BEAM INTERRUPTION DETECTED");}persist();}else logEvent(EVT_BEAM_RESTORE,reading);previousBeamDetected=beamDetected;}if(beamDetected)baseline=(baseline*31+reading)/32;}
void handleStatus(){respond(200,statusJson());}
void handleEvents(){String s="[";for(size_t i=0;i<eventCount;i++){size_t idx=(eventHead+MAX_EVENTS-eventCount+i)%MAX_EVENTS;if(i)s+=",";s+="{\"t\":"+String(events[idx].seconds)+",\"type\":"+String(events[idx].type)+",\"value\":"+String(events[idx].value)+"}";}s+="]";respond(200,s);}
void handleCommand(const String& c){if(c=="arm_loud")setMode(ARMED_LOUD);else if(c=="arm_silent")setMode(ARMED_SILENT);else if(c=="disarm")setMode(OFF);else if(c=="laser_on")commandLaser(true);else if(c=="laser_off")commandLaser(false);else if(c=="silence"){alarmActive=false;digitalWrite(PIN_BUZZER,LOW);logEvent(EVT_ALARM_OFF);}else{respond(400,"{\"error\":\"unknown command\"}");return;}respond(200,statusJson());}
void setup(){Serial.begin(115200);pinMode(PIN_LDR,INPUT);pinMode(PIN_IR_EMITTER,OUTPUT);pinMode(PIN_BUZZER,OUTPUT);digitalWrite(PIN_IR_EMITTER,HIGH);digitalWrite(PIN_BUZZER,LOW);bootMs=millis();prefs.begin("reactance",false);triggerCount=prefs.getUInt("triggers",0);activationCount=prefs.getUInt("activations",0);deactivationCount=prefs.getUInt("deactivations",0);logEvent(EVT_BOOT);WiFi.mode(WIFI_STA);WiFi.begin(WIFI_SSID,WIFI_PASSWORD);Serial.print("Wi-Fi connecting");while(WiFi.status()!=WL_CONNECTED){delay(300);Serial.print('.');}Serial.println();Serial.print("ESP32 IP: ");Serial.println(WiFi.localIP());server.on("/api/status",HTTP_GET,handleStatus);server.on("/api/events",HTTP_GET,handleEvents);server.on("/api/arm/loud",HTTP_POST,[](){handleCommand("arm_loud");});server.on("/api/arm/silent",HTTP_POST,[](){handleCommand("arm_silent");});server.on("/api/disarm",HTTP_POST,[](){handleCommand("disarm");});server.on("/api/laser/on",HTTP_POST,[](){handleCommand("laser_on");});server.on("/api/laser/off",HTTP_POST,[](){handleCommand("laser_off");});server.on("/api/alarm/silence",HTTP_POST,[](){handleCommand("silence");});server.onNotFound([](){if(server.method()==HTTP_OPTIONS){cors();server.send(204);return;}respond(404,"{\"error\":\"not found\"}");});server.begin();}
void loop(){server.handleClient();if(millis()-lastSampleMs>=50){lastSampleMs=millis();evaluateBeam();}if(alarmActive&&beamDetected&&millis()-lastTriggerMs>500){alarmActive=false;digitalWrite(PIN_BUZZER,LOW);logEvent(EVT_ALARM_OFF);}}
