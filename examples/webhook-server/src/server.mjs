import express from "express";
import {
  WebhookSignatureError,
  verifyWebhookSignature,
} from "@liqhtworks/sophon-sdk";

const secret = process.env.SOPHON_WEBHOOK_SECRET;
if (!secret) {
  throw new Error("SOPHON_WEBHOOK_SECRET is required");
}

const app = express();

app.post(
  "/webhooks/sophon",
  express.raw({ type: "application/json", limit: "2mb" }),
  async (req, res) => {
    if (!Buffer.isBuffer(req.body)) {
      res.status(400).send("raw body required");
      return;
    }

    try {
      await verifyWebhookSignature({
        rawBody: req.body,
        signatureHeader: req.get("X-Turbo-Signature-256"),
        timestampHeader: req.get("X-Turbo-Timestamp"),
        secret,
      });
    } catch (err) {
      if (err instanceof WebhookSignatureError) {
        console.warn("rejected SOPHON webhook", { reason: err.reason });
      }
      res.status(401).send("invalid signature");
      return;
    }

    const event = JSON.parse(req.body.toString("utf8"));
    console.log("accepted SOPHON webhook", {
      type: event.type,
      id: event.id,
    });

    res.sendStatus(204);
  },
);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`listening on :${port}`);
});
