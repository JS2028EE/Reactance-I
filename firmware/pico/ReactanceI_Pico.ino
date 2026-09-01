// Reactance I — Raspberry Pi Pico V1
// Receives the 38 kHz NEC-compatible IR frame from the ESP32.
// IR receiver modules are normally active-LOW at their signal pin.

constexpr uint8_t PIN_IR_RECEIVER=16;
constexpr uint8_t PIN_LASER=15;

bool laserOn=false;
uint32_t validFrames=0, invalidFrames=0;
unsigned long lastFrameMs=0;

bool waitForLevel(uint8_t level,uint32_t timeoutUs){unsigned long start=micros();while(digitalRead(PIN_IR_RECEIVER)!=level){if(micros()-start>timeoutUs)return false;}return true;}
bool measureLevel(uint8_t level,uint32_t maxUs,uint32_t &duration){unsigned long start=micros();while(digitalRead(PIN_IR_RECEIVER)==level){if(micros()-start>maxUs)return false;}duration=micros()-start;return true;}
bool nearUs(uint32_t v,uint32_t target,uint32_t tolerance){return v>=target-tolerance&&v<=target+tolerance;}

bool readNEC(uint8_t &command){
  // Idle HIGH -> 9 ms LOW mark -> 4.5 ms HIGH space.
  if(!waitForLevel(LOW,30000))return false;
  uint32_t d=0;
  if(!measureLevel(LOW,12000,d)||!nearUs(d,9000,1500))return false;
  if(!measureLevel(HIGH,7000,d)||!nearUs(d,4500,1000))return false;

  uint8_t data[4]={0,0,0,0};
  for(uint8_t byteIndex=0;byteIndex<4;byteIndex++){
    for(uint8_t bit=0;bit<8;bit++){
      if(!measureLevel(LOW,1500,d)||!nearUs(d,560,250))return false;
      if(!measureLevel(HIGH,2500,d))return false;
      if(d>1000)data[byteIndex]|=(1<<bit);
      else if(d<300)return false;
    }
  }
  // Stop mark.
  if(!measureLevel(LOW,1500,d)||!nearUs(d,560,300))return false;
  if(data[0]!=0x00||data[1]!=(uint8_t)~data[0]||data[3]!=(uint8_t)~data[2])return false;
  command=data[2];
  return true;
}

void setLaser(bool on){laserOn=on;digitalWrite(PIN_LASER,on?HIGH:LOW);Serial.println(on?"LASER=ON":"LASER=OFF");}

void setup(){Serial.begin(115200);pinMode(PIN_IR_RECEIVER,INPUT);pinMode(PIN_LASER,OUTPUT);setLaser(false);Serial.println("Reactance I Pico V1 online");}

void loop(){
  uint8_t command=0;
  if(readNEC(command)){
    lastFrameMs=millis();validFrames++;
    if(command==0xA1)setLaser(true);
    else if(command==0xA0)setLaser(false);
    else Serial.printf("UNKNOWN_IR=0x%02X\n",command);
  }
  delay(2);
}
