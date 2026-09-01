# Reactance I LAN Integration

The ESP32 currently reports this LAN address during boot:

`192.168.1.212`

The dashboard communicates directly with the ESP32 over HTTP while the browser/device and ESP32 are on the same Wi-Fi network.

## Dashboard API

- `GET /api/status`
- `GET /api/events`
- `POST /api/arm/loud`
- `POST /api/arm/silent`
- `POST /api/disarm`
- `POST /api/laser/on`
- `POST /api/laser/off`
- `POST /api/alarm/silence`

## Notification path

ESP32 -> Cloudflare Worker `/notify` -> Telegram.

The GitHub Pages website URL is **not** the notification endpoint. The ESP32 notification URL must be the Cloudflare Worker URL ending in `/notify`.

## Current test procedure

1. Put the ESP32 and phone/computer on the same Wi-Fi.
2. Open `http://192.168.1.212/api/status` in a browser on that network.
3. Confirm JSON is returned.
4. Open the dashboard.
5. Set its ESP32 API base to `http://192.168.1.212` if needed.
6. Test DISARM, ARM LOUD, ARM SILENT, LASER ON/OFF, and SILENCE.
7. Break the laser beam and verify the event registry and Telegram notification.

If the router assigns the ESP32 a different IP after reboot, update the dashboard configuration with the new address or reserve the ESP32 address in the router.
