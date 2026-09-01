# Reactance I V1 Architecture

## Data/control chain

1. The ESP32 owns system state.
2. The ESP32 sends laser ON/OFF commands over IR.
3. The Pico receives the IR command and switches the laser-side output.
4. The laser illuminates the LDR on the ESP32 side.
5. The ESP32 classifies beam presence and detects interruptions only while armed.
6. Loud mode activates the local buzzer; silent mode leaves the buzzer quiet and is intended to call the notification layer.
7. The dashboard reads the ESP32 HTTP API.

## States

- `OFF`
- `ARMED_LOUD`
- `ARMED_SILENT`

The explicit state is essential: an intentionally disabled laser must not be interpreted as an intrusion.

## Dashboard

The dashboard is intentionally dark, technical, and state-forward. Active controls receive an `active` visual state so the operator can immediately see what is enabled.
