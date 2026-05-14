// Standalone webhook-signature verification — no Express, no server bundle.
// Useful as a unit-test reference for any framework. Drop `verifyWebhookSignature`
// into your platform's handler with the RAW body and required headers.
//
// Run (with simulated values):
//   node examples/verify-webhook.mjs

import { verifyWebhookSignature, WebhookSignatureError } from "@liqhtworks/sophon-sdk";
import { createHmac } from "node:crypto";

const secret = "whsec_demo_secret";
const body = JSON.stringify({ type: "job.completed", job_id: "job_demo" });
const timestamp = new Date().toISOString();

// Sign the payload as the server would.
const mac = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
const signature = `sha256=${mac}`;

try {
  await verifyWebhookSignature({
    rawBody: body,
    signatureHeader: signature,
    timestampHeader: timestamp,
    secret,
  });
  console.log("verified ok");
} catch (err) {
  if (err instanceof WebhookSignatureError) {
    console.error("verification failed:", err.reason);
    process.exit(1);
  }
  throw err;
}

// Tamper the body — should fail with signature_mismatch.
try {
  await verifyWebhookSignature({
    rawBody: body + " ",
    signatureHeader: signature,
    timestampHeader: timestamp,
    secret,
  });
  console.error("FAIL: tampered body verified");
  process.exit(2);
} catch (err) {
  console.log("tampered body rejected:", err.reason);
}
