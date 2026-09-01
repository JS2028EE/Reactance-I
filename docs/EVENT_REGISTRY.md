# Reactance I Event Registry

The ESP32 records a rolling registry of important system events in RAM and persists aggregate counters in NVS Preferences.

## Event types

| Code | Event |
|---:|---|
| 0 | BOOT |
| 1 | SYSTEM ARMED |
| 2 | SYSTEM DISARMED |
| 3 | MODE CHANGE |
| 4 | LASER ON |
| 5 | LASER OFF |
| 6 | BEAM INTERRUPTION |
| 7 | BEAM RESTORED |
| 8 | ALARM ACTIVE |
| 9 | ALARM CLEARED |

The registry is intentionally designed so later versions can add wall-clock timestamps, notification IDs, sensor values, and persistent storage without changing the high-level architecture.
