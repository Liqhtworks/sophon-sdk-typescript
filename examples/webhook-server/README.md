# Express Webhook Server

```bash
npm install
SOPHON_WEBHOOK_SECRET=whsec_... npm run dev
```

Register `POST /webhooks/sophon` as the webhook endpoint. The route uses
`express.raw()` so signature verification receives the original request bytes.
