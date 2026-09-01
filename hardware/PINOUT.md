# Reactance I V1 Pinout

> Verify these against the actual assembled breadboards before applying power. Firmware pin constants must match the physical wiring.

## Breadboard 1 — ESP32

| Function | ESP32 GPIO |
|---|---:|
| LDR analog input | GPIO 34 |
| IR emitter output | GPIO 25 |
| Buzzer control | GPIO 26 |

## Breadboard 2 — Raspberry Pi Pico

| Function | Pico GPIO |
|---|---:|
| IR receiver input | GP16 |
| Laser control output | GP15 |

Power and ground must follow the specific modules being used. Do not connect a load directly to a GPIO if its current requirement exceeds the GPIO's safe drive capability; use an appropriate transistor/MOSFET driver.
