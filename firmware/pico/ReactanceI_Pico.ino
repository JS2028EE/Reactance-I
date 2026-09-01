// Reactance I — Raspberry Pi Pico V1
// Receives the ESP32 IR command and controls the laser output.
// VERIFY GPIO numbers against the physical wiring.

constexpr uint8_t PIN_IR_RECEIVER = 16;
constexpr uint8_t PIN_LASER = 15;

volatile uint32_t irEdges = 0;
bool laserOn = false;
unsigned long lastFrameMs = 0;

// Matches the simple V1 pulse framing used by the ESP32:
// 9 ms LOW, 4.5 ms HIGH, then 8 data bits, LSB first.
bool readFrame(uint8_t &command) {
  unsigned long start = micros();
  while (digitalRead(PIN_IR_RECEIVER) == HIGH) {
    if (micros() - start > 30000) return false;
  }
  unsigned long lowStart = micros();
  while (digitalRead(PIN_IR_RECEIVER) == LOW) {
    if (micros() - lowStart > 15000) return false;
  }
  unsigned long highStart = micros();
  while (digitalRead(PIN_IR_RECEIVER) == HIGH) {
    if (micros() - highStart > 8000) return false;
  }

  command = 0;
  for (uint8_t i = 0; i < 8; ++i) {
    while (digitalRead(PIN_IR_RECEIVER) == HIGH) {
      if (micros() - start > 50000) return false;
    }
    unsigned long bitLow = micros();
    while (digitalRead(PIN_IR_RECEIVER) == LOW) {
      if (micros() - bitLow > 2000) return false;
    }
    unsigned long markStart = micros();
    while (digitalRead(PIN_IR_RECEIVER) == HIGH) {
      if (micros() - markStart > 2500) return false;
    }
    unsigned long mark = micros() - markStart;
    if (mark > 1000) command |= (1 << i);
  }
  return true;
}

void setLaser(bool on) {
  laserOn = on;
  digitalWrite(PIN_LASER, on ? HIGH : LOW);
  Serial.println(on ? "LASER=ON" : "LASER=OFF");
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_IR_RECEIVER, INPUT);
  pinMode(PIN_LASER, OUTPUT);
  setLaser(false);
  Serial.println("Reactance I Pico V1 online");
}

void loop() {
  uint8_t command = 0;
  if (readFrame(command)) {
    lastFrameMs = millis();
    if (command == 0xA1) setLaser(true);
    else if (command == 0xA0) setLaser(false);
    else Serial.printf("UNKNOWN_IR=0x%02X\n", command);
  }
}
