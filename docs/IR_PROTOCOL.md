# Reactance I V1 IR Protocol

V1 uses a deliberately simple pulse frame while the exact IR receiver/emitter hardware is being validated.

- `0xA1` = LASER ON
- `0xA0` = LASER OFF

Frame concept:

```text
9 ms LOW → 4.5 ms HIGH → 8 data bits, LSB first
```

The Pico ignores unknown command bytes.

**Important:** common 38 kHz demodulating IR receiver modules expect a carrier, while a bare IR photodiode does not. If the physical receiver is a demodulating module, the transmitter implementation should be upgraded to a matching carrier/protocol rather than assuming a raw GPIO pulse is sufficient.
