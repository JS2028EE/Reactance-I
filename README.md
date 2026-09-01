# ⚡ Reactance I — Laser-Triggered Wireless Alarm System

Reactance I is a two-controller laser-beam security/alarm prototype.

## V1 architecture

```text
PHONE / GITHUB PAGES DASHBOARD
              │
              │ API (local/LAN path)
              ▼
            ESP32
       ┌──────┼──────┐
       │      │      └── 38 kHz IR emitter → IR receiver → Pico → Laser
       │      └── Buzzer
       └── LDR
              ▲
              └──────── laser beam
```

V1 uses the ESP32 as the primary controller and Raspberry Pi Pico as the remote laser-side controller. Arduino Uno R3 is not used.

## V1 capabilities

- OFF / ARMED-LOUD / ARMED-SILENT states
- Laser and beam status
- Trigger, activation, and deactivation counters
- Event registry
- Persistent counters across ESP32 reboot
- 38 kHz NEC-compatible IR control
- Phone/desktop dashboard
- Notification gateway foundation
- GitHub Pages deployment

## Repository layout

```text
README.md
index.html                         # root redirect to dashboard
website/                            # official GitHub Pages dashboard
  index.html
  style.css
  app.js
firmware/esp32/ReactanceI_ESP32.ino
firmware/pico/ReactanceI_Pico.ino
backend/worker.js
backend/wrangler.toml
protocol/IR_PROTOCOL.md
hardware/PINOUT.md
hardware/WIRING.md
docs/ARCHITECTURE.md
docs/EVENT_REGISTRY.md
docs/DEVELOPMENT.md
.github/workflows/pages.yml
```

## Dashboard deployment

GitHub Pages deploys the **`website/`** directory through `.github/workflows/pages.yml`. The root `index.html` is only a fallback redirect.

## Notification architecture

```text
ESP32
  │ HTTPS POST /notify + device key
  ▼
Cloudflare Worker
  │ server-side Telegram bot token
  ▼
Telegram Bot API
  ▼
Your phone
```

Telegram and Cloudflare credentials are never stored in GitHub source. Configure them as Worker secrets.

## Important network limitation

A GitHub Pages site is public HTTPS, while an ESP32 on a home Wi-Fi network normally has a private LAN address. A browser cannot reliably use a public GitHub Pages page as a direct tunnel into a private ESP32, and HTTPS pages can be blocked from calling an HTTP ESP32 because of mixed-content rules. V1 therefore treats the direct ESP32 dashboard API as a LAN/testing path. A future remote dashboard should use an authenticated cloud telemetry/control bridge rather than exposing port 80 directly to the Internet.

## Hardware warning

Verify the pin constants against the actual wiring before powering the final system. A laser or buzzer module should be driven through an appropriate transistor/MOSFET driver when its current requirement exceeds safe GPIO capability.
