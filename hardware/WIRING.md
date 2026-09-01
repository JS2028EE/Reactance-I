# Reactance I V1 Wiring

## Breadboard 1

- ESP32 GND → common breadboard GND rail.
- LDR voltage-divider output → ESP32 GPIO 34.
- IR emitter drive circuit → ESP32 GPIO 25; emitter circuit GND → common GND.
- Buzzer driver/input → ESP32 GPIO 26; driver/load GND → common GND.

## Breadboard 2

- Pico GND → breadboard 2 GND rail.
- IR receiver signal → Pico GP16.
- IR receiver power/GND → the voltage specified by the module and a common reference with the Pico.
- Laser control input/driver → Pico GP15.

### Important

A Pico/ESP32 GPIO is a logic signal, not a general-purpose power supply. If the buzzer or laser module draws significant current, drive it through a suitable transistor/MOSFET stage with a flyback diode where required. A laser module must also be operated within its rated voltage/current.

The dashboard and firmware pin constants must match this document and the actual build.
