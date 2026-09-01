# ⚡ Reactance I — Laser-Triggered Wireless Alarm System

Reactance I is a two-controller laser-beam security/alarm prototype.

## V1 architecture

```text
PHONE / DASHBOARD
       ↕ Wi-Fi / API
      ESP32
   ┌───┼────┐
   │   │    └── IR emitter → IR receiver → Raspberry Pi Pico → Laser
   │   └── Buzzer
   └── Photoresistor
          ↑
          └──────────── laser beam
```

V1 uses an ESP32 as the primary controller and a Raspberry Pi Pico as the remote laser-side controller. Arduino Uno R3 is not used.

## V1 software
- OFF / ARMED-LOUD / ARMED-SILENT states
- Laser and beam status
- Trigger counting
- Activation/deactivation registry
- Event history with timestamps
- IR command protocol
- Phone dashboard
- Notification API integration
- GitHub Pages dashboard

## Repository layout

```text
firmware/esp32/ReactanceI_ESP32.ino
firmware/pico/ReactanceI_Pico.ino
dashboard/index.html
dashboard/style.css
dashboard/app.js
docs/ARCHITECTURE.md
docs/IR_PROTOCOL.md
docs/EVENT_REGISTRY.md
.github/workflows/pages.yml
```

**Hardware warning:** verify the pin constants against the actual wiring before powering the final system. A laser module should be driven through an appropriate driver when its current requirement exceeds safe GPIO capability.
