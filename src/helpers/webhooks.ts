// Webhook signature verification for inbound terminal-job deliveries.
//
// SOPHON signs each delivery with HMAC-SHA256 over `"{timestamp}.{raw_body}"`
// using the per-webhook secret. The hex digest is sent as
// `X-Turbo-Signature-256: sha256=<hex>`.
//
// Isomorphic: uses the Web Crypto API (`crypto.subtle`), available globally in
// Node 18+ and modern browsers. No Node-specific imports.
//
// Consumers call `verifyWebhookSignature` with the RAW request body (string or
// Uint8Array — NOT a parsed JSON object), the signature header, the timestamp
// header, and the webhook secret. The helper does a constant-time comparison
// and enforces a replay window by default.

export interface VerifyWebhookSignatureParams {
  /** Raw HTTP body exactly as received, before any JSON parsing. */
  rawBody: string | Uint8Array;
  /** Value of `X-Turbo-Signature-256`, e.g. `"sha256=abc..."`. */
  signatureHeader: string | null | undefined;
  /** Value of `X-Turbo-Timestamp`. */
  timestampHeader: string | null | undefined;
  /** Webhook secret returned by `POST /v1/webhooks`. */
  secret: string;
  /** Maximum acceptable clock skew in ms. Default 5 min. Set 0 to disable. */
  replayWindowMs?: number;
  /** Override "now" for deterministic tests. */
  now?: () => number;
}

export class WebhookSignatureError extends Error {
  readonly reason:
    | "missing_signature"
    | "missing_timestamp"
    | "invalid_timestamp"
    | "replay_window_exceeded"
    | "bad_prefix"
    | "bad_signature_encoding"
    | "signature_mismatch";
  constructor(reason: WebhookSignatureError["reason"], message?: string) {
    super(message ?? reason);
    this.name = "WebhookSignatureError";
    this.reason = reason;
  }
}

/**
 * Throws `WebhookSignatureError` if the delivery is not authentic. Returns
 * a resolved promise on success.
 */
export async function verifyWebhookSignature(
  params: VerifyWebhookSignatureParams,
): Promise<void> {
  const {
    rawBody,
    signatureHeader,
    timestampHeader,
    secret,
    replayWindowMs = 5 * 60 * 1000,
    now = Date.now,
  } = params;

  if (!signatureHeader) throw new WebhookSignatureError("missing_signature");
  if (!timestampHeader) throw new WebhookSignatureError("missing_timestamp");

  const deliveredTs = Date.parse(timestampHeader);
  if (Number.isNaN(deliveredTs)) {
    throw new WebhookSignatureError("invalid_timestamp");
  }

  if (replayWindowMs > 0) {
    const drift = Math.abs(now() - deliveredTs);
    if (drift > replayWindowMs) {
      throw new WebhookSignatureError("replay_window_exceeded");
    }
  }

  if (!signatureHeader.startsWith("sha256=")) {
    throw new WebhookSignatureError("bad_prefix");
  }
  const deliveredHex = signatureHeader.slice("sha256=".length).trim();
  const delivered = hexToBytes(deliveredHex);
  if (!delivered) {
    throw new WebhookSignatureError("bad_signature_encoding");
  }

  const bodyBytes =
    typeof rawBody === "string" ? new TextEncoder().encode(rawBody) : rawBody;
  const payload = concatBytes(
    new TextEncoder().encode(`${timestampHeader}.`),
    bodyBytes,
  );

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = new Uint8Array(
    // TS 5.7+ tightened BufferSource to require ArrayBufferView<ArrayBuffer>;
    // our concatenated Uint8Array is backed by an ArrayBuffer at runtime.
    await crypto.subtle.sign("HMAC", key, payload as BufferSource),
  );

  if (!constantTimeEqual(delivered, expected)) {
    throw new WebhookSignatureError("signature_mismatch");
  }
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(hex)) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}
