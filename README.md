# @liqhtworks/sophon-sdk

Official TypeScript / JavaScript SDK for the [SOPHON Encoding API](https://liqhtworks.xyz).

> **This package is generated.** Source lives in [Liqhtworks/sophon-api](https://github.com/Liqhtworks/sophon-api) (`api/openapi.yaml` + `api/sdk/helpers/typescript/`). Do not edit files in this repository by hand — changes are overwritten on every release.

## Install

```bash
npm install @liqhtworks/sophon-sdk
# or
bun add @liqhtworks/sophon-sdk
```

## Quick start

```ts
import {
  Configuration,
  JobsApi,
  UploadsApi,
  uploadFile,
  waitForJob,
  verifyWebhookSignature,
} from "@liqhtworks/sophon-sdk";

const config = new Configuration({
  basePath: "https://api.liqhtworks.xyz",
  accessToken: process.env.SOPHON_API_KEY,
});

const uploads = new UploadsApi(config);
const jobs = new JobsApi(config);

// 1. Upload a file (chunked, concurrent, resumable).
const { uploadId } = await uploadFile({
  api: uploads,
  source: fileBlob,           // Blob / File
  fileName: "source.mov",
  mimeType: "video/quicktime",
  onProgress: (p) => console.log(`${p.partsDone}/${p.partsTotal}`),
});

// 2. Start an encode.
const job = await jobs.createJob({
  idempotencyKey: crypto.randomUUID(),
  createJobRequest: {
    source: { type: "upload", upload_id: uploadId },
    profile: "sophon-auto",
  },
});

// 3. Wait for it to finish.
const done = await waitForJob({ api: jobs, jobId: job.id });
console.log(done.status); // "completed"
```

## Webhook verification

```ts
import { verifyWebhookSignature } from "@liqhtworks/sophon-sdk";

// In your webhook handler — `rawBody` MUST be the raw bytes, not parsed JSON.
await verifyWebhookSignature({
  rawBody,
  signatureHeader: req.headers["x-turbo-signature-256"],
  timestampHeader: req.headers["x-turbo-timestamp"],
  secret: process.env.SOPHON_WEBHOOK_SECRET,
});
```

## Runtime support

- Node 18+
- Bun 1+
- Modern browsers (`uploadFile` uses `Blob`; `verifyWebhookSignature` uses Web Crypto)

## License

Proprietary — see [`LICENSE`](./LICENSE).
