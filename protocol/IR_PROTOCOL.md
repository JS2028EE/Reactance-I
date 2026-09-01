# Reactance I IR Protocol

## V1 direction

ESP32 → IR emitter → IR receiver → Raspberry Pi Pico.

## Physical layer

The ESP32 emits a **38 kHz modulated IR carrier**. The expected receiver is a demodulating IR receiver module with an active-LOW digital output.

## Frame

V1 uses a NEC-compatible 32-bit frame:

```text
9 ms mark + 4.5 ms space
ADDRESS      = 0x00
ADDRESS_INV  = 0xFF
COMMAND      = command byte
COMMAND_INV  = bitwise inverse of command
560 us stop mark
```

Commands:

| Command | Byte |
|---|---:|
| LASER_OFF | `0xA0` |
| LASER_ON | `0xA1` |

The Pico validates the inverse bytes before accepting a command. Unknown commands are ignored and printed to Serial.

## Safety / reliability goals

- Reject malformed frames.
- Require a valid NEC frame before changing the laser state.
- Keep the laser OFF after Pico boot until a valid `LASER_ON` command is received.
- Provide Serial diagnostics.
- Leave room for protocol versioning in V2.
