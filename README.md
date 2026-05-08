# @liqhtworks/sophon-sdk

Official TypeScript SDK for the SOPHON Encoding API.

This repository is generated from `Liqhtworks/sophon-api`. The curated
`README.md` and `examples/` directory are preserved across SDK regeneration.

## Install

```bash
npm install @liqhtworks/sophon-sdk
```

Requires Node 18+ or a runtime with `fetch`, `Blob`, `AbortController`, and Web
Crypto.

## Quick Start

```ts
import {
  Configuration,
  UploadsApi,
  uploadFile,
} from "@liqhtworks/sophon-sdk";
import { Blob } from "node:buffer";
import { readFile } from "node:fs/promises";

const config = new Configuration({
  basePath: process.env.SOPHON_BASE_URL ?? "https://api.liqhtworks.xyz",
  accessToken: process.env.SOPHON_API_KEY,
});

const uploads = new UploadsApi(config);

const bytes = await readFile("./source.mov");
const source = new Blob([bytes], { type: "video/quicktime" });

const upload = await uploadFile({
  api: uploads,
  source,
  fileName: "source.mov",
  mimeType: "video/quicktime",
  concurrency: 4,
  onProgress: (p) => console.log(`${p.partsDone}/${p.partsTotal} parts`),
});

console.log(upload.uploadId);
```

For a standalone file-path upload recipe, see
[`examples/upload-node-path.mjs`](./examples/upload-node-path.mjs).

## Webhooks

Use `verifyWebhookSignature` with the raw request body before JSON parsing.

See [`examples/webhook-server`](./examples/webhook-server) for an Express
handler that preserves the raw body, verifies `X-Turbo-Signature-256`, and only
then parses JSON.

## Helpers

| Helper | Purpose |
|---|---|
| `uploadFile` | Chunked upload orchestration with bounded concurrency, retries, resume, and progress callbacks. |
| `waitForJob` | Poll until terminal status with timeout and typed errors. |
| `verifyWebhookSignature` | Constant-time HMAC verification plus replay-window enforcement. |

## API Docs

Generated endpoint/model docs live under [`docs/`](./docs).

## Development

```bash
npm install
npm run build
```

## Versioning

`@liqhtworks/sophon-sdk` follows [SemVer](https://semver.org/), with one
pre-1.0 caveat: while we are at `v0.x`, **minor bumps may include
breaking changes**. Pin a tilde range until 1.0:

```bash
npm install @liqhtworks/sophon-sdk@~0.1
```

Patch releases (`0.1.x`) are always backward-compatible — they ship bug
fixes, helper-layer improvements, and additive types. Once we cut
`v1.0.0`, regular SemVer applies and breaking changes only land on
major bumps. See [`CHANGELOG.md`](./CHANGELOG.md) for the per-release
log.

## License

Proprietary. See [`LICENSE`](./LICENSE).
