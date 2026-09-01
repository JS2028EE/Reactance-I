# Reactance I Backend — Notification Gateway

The V1 backend is a Cloudflare Worker that receives an authenticated HTTPS notification request from the ESP32 and forwards the event to a Telegram bot.

## Architecture

```text
ESP32 --HTTPS + Bearer device key--> Cloudflare Worker --Bot token--> Telegram --> phone
```

## Required Worker secrets

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `REACTANCE_DEVICE_KEY`

Never put these values in GitHub source, `wrangler.toml`, the dashboard JavaScript, or a screenshot.

## Deploy

From the `backend/` directory:

```bash
npx wrangler login
npx wrangler deploy
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
npx wrangler secret put REACTANCE_DEVICE_KEY
```

If secrets are added after deployment, Wrangler creates a new Worker version. Run `npx wrangler deploy` afterward if your workflow requires a code redeploy.

## ESP32 configuration

Set these constants in the ESP32 firmware:

```cpp
const char* NOTIFY_URL = "https://YOUR-WORKER.workers.dev/notify";
const char* NOTIFY_DEVICE_KEY = "YOUR_RANDOM_DEVICE_KEY";
```

The device key must exactly match the Worker secret `REACTANCE_DEVICE_KEY`.

## Test

Check:

```text
GET /health
```

Then trigger a controlled `/notify` request. Do not test by committing credentials into the repository.
