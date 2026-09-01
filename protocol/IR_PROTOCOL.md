# Reactance I IR Protocol

## V1 direction

ESP32 → IR emitter → IR receiver → Raspberry Pi Pico.

## Command layer

V1 uses explicit command frames rather than treating the IR receiver output as a direct laser switch.

Reserved commands:

- `LASER_ON`
- `LASER_OFF`
- `PING`
- `STATUS`

The exact carrier frequency, timing, checksum/framing, and receiver module behavior must be verified against the physical IR hardware before finalizing the protocol.

## Design goals

- Reject malformed commands.
- Avoid accidental laser activation from noise.
- Provide serial diagnostics during testing.
- Leave room for protocol versioning in V2.
