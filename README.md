# MASTER-IP Session

Standalone pairing portal for MASTER-IP Bot.

## Deploy

Render is recommended because WhatsApp pairing needs a live Node process while the phone is being paired.

```bash
npm install
npm start
```

Use Node 20 or newer.

Vercel can serve the same `api/` handlers, but serverless cold starts can interrupt the active WhatsApp socket before pairing finishes.

## Flow

1. Open the site.
2. Enter the WhatsApp number with country code.
3. Pair the code in WhatsApp.
4. Copy the generated `MASTER-IP~...` Session ID.
5. Paste it into the main MASTER-IP bot Session ID login.
