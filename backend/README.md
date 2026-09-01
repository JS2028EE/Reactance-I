# Reactance I Backend

The backend is the secure notification/control bridge for Reactance I V1.

## Planned role

- Receive authenticated telemetry from the ESP32.
- Forward selected alarm events to a notification provider.
- Keep secrets out of GitHub Pages and browser JavaScript.
- Optionally provide a stable HTTPS API for the dashboard.

## Notification provider

Telegram is the current candidate. The bot token must be stored as a backend secret/environment variable and must never be committed to this repository.

## Deployment

`worker.js` is structured as a Cloudflare Worker-style entry point. Configure secrets in the deployment platform, then point the ESP32 and dashboard at the deployed HTTPS endpoint.
