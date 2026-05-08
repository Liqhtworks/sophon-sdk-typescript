# Changelog

All notable changes to `@liqhtworks/sophon-sdk` are recorded here. The
package follows [SemVer](https://semver.org/) — see `README.md` for the
versioning policy applied during the v0.x pre-1.0 phase.

## [0.1.4] — 2026-05-08

- `JobSource.upload(uploadId)` constructor — typed alternative to the
  fragile `{ type: "upload", upload_id: "..." }` literal.
- Generated exports tightened so all helpers and discriminated-union
  constructors are reachable at the top level.
- Build-test coverage extended over the new surface.

## [0.1.3] — 2026-05-08

- `UploadsApiLike` helper interface narrowed to only the fields the
  helpers actually read. The previous declaration typed `expires_at`
  as `string`, but the generated `UploadsApi` returns `Date`, so the
  helper compiled in isolation but not against the real client. Fixed.

## [0.1.2] — 2026-04-23

- Per-route idempotency keys in `uploadFile`. Earlier releases reused
  one key for both `createUpload` and `completeUpload`; SOPHON scopes
  idempotency keys per route and rejected the second call with HTTP 409.
  Now derives `${idem}/create` and `${idem}/complete` from the caller's
  seed so retries still reach the server's idempotent path.
- Build-test fixtures regenerate as real ffprobe-able media via ffmpeg.

## [0.1.0] — 2026-04-23

Initial public release.

- Generated transport (`Configuration`, `JobsApi`, `UploadsApi`,
  `WebhooksApi`, `DownloadsApi`, `HealthApi`) from the SOPHON OpenAPI
  spec.
- Hand-written helpers spliced on top of the generated client:
  - `uploadFile` — chunked, concurrent, resumable upload with progress
    reporting and bounded retry.
  - `waitForJob` — typed terminal-state polling with backoff and
    timeout.
  - `verifyWebhookSignature` — constant-time HMAC-SHA256 verification
    with a default replay window. Uses Web Crypto so it runs on Node
    18+ and modern browsers.
- Provenance signed via npm sigstore on every publish.

[0.1.4]: https://github.com/Liqhtworks/sophon-sdk-typescript/releases/tag/v0.1.4
[0.1.3]: https://github.com/Liqhtworks/sophon-sdk-typescript/releases/tag/v0.1.3
[0.1.2]: https://github.com/Liqhtworks/sophon-sdk-typescript/releases/tag/v0.1.2
[0.1.0]: https://github.com/Liqhtworks/sophon-sdk-typescript/releases/tag/v0.1.0
