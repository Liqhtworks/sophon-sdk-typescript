// Upload orchestration on top of the generated UploadsApi.
//
// The generated SDK exposes createUpload / uploadPart / completeUpload as
// separate calls; this wrapper handles chunk slicing, bounded concurrency,
// per-part retry, resume against existing sessions, and progress reporting.

// Narrow structural type — only the fields the helper actually reads.
// Keeping it tight lets the generated UploadsApi (which carries Date /
// nullable / extra metadata fields) satisfy this interface without
// explicit casts at the call site.
export interface UploadsApiLike {
  createUpload(params: {
    createUploadRequest: { file_name: string; file_size: number; mime_type: string };
    idempotencyKey: string;
  }): Promise<{ id: string; chunk_size: number; total_chunks: number }>;

  uploadPart(params: {
    id: string;
    partNumber: number;
    body: Blob;
  }): Promise<{ part_number: number; received: boolean }>;

  completeUpload(params: {
    id: string;
    idempotencyKey: string;
  }): Promise<{ id: string; sha256: string; bytes: number }>;

  getUpload(params: { id: string }): Promise<{
    id: string;
    total_chunks: number;
    received_chunks: number[];
  }>;
}

export interface UploadProgress {
  bytesUploaded: number;
  bytesTotal: number;
  partsDone: number;
  partsTotal: number;
}

/**
 * Acceptable upload sources. The helper coerces each one to a `Blob`
 * internally so the rest of the chunking pipeline only deals with one shape.
 *
 *  - `Blob` — pass through (browser + Node 18+).
 *  - `Uint8Array` (incl. Node `Buffer`) / `ArrayBuffer` — wrapped in a Blob.
 *  - `string` — treated as a filesystem path (Node only). Read fully into memory.
 *  - `{ path: string }` — same as string path, for explicit call sites.
 *  - `{ data: Uint8Array | ArrayBuffer }` — explicit byte buffer.
 */
export type UploadSource =
  | Blob
  | Uint8Array
  | ArrayBuffer
  | string
  | { path: string }
  | { data: Uint8Array | ArrayBuffer };

export interface UploadFileParams {
  api: UploadsApiLike;
  source: UploadSource;
  fileName: string;
  mimeType: string;
  /** Resume a prior session instead of creating a new one. */
  uploadId?: string;
  /** Parallel in-flight chunks. Default 4. */
  concurrency?: number;
  /** Retries per chunk before aborting. Default 3. */
  retries?: number;
  /** Base backoff in ms; doubles each attempt. Default 500. */
  retryBaseMs?: number;
  /** Idempotency key reused for createUpload + completeUpload. Auto-generated if omitted. */
  idempotencyKey?: string;
  onProgress?: (p: UploadProgress) => void;
  /** Abort the whole upload. Chunks in flight will still settle. */
  signal?: AbortSignal;
}

export interface UploadFileResult {
  uploadId: string;
  sha256: string;
  bytes: number;
}

export async function uploadFile(params: UploadFileParams): Promise<UploadFileResult> {
  const {
    api,
    source: rawSource,
    fileName,
    mimeType,
    uploadId: resumeId,
    concurrency = 4,
    retries = 3,
    retryBaseMs = 500,
    idempotencyKey = randomIdempotencyKey(),
    onProgress,
    signal,
  } = params;

  const source = await coerceUploadSource(rawSource, mimeType);

  if (concurrency < 1) throw new RangeError("concurrency must be >= 1");
  if (retries < 0) throw new RangeError("retries must be >= 0");

  let uploadId: string;
  let chunkSize: number;
  let totalChunks: number;
  let alreadyReceived = new Set<number>();

  if (resumeId) {
    const status = await api.getUpload({ id: resumeId });
    uploadId = status.id;
    totalChunks = status.total_chunks;
    alreadyReceived = new Set(status.received_chunks);
    // Derive chunk size from file size / totalChunks. Last chunk may be smaller;
    // we only need the head size to slice, so use ceil.
    chunkSize = Math.ceil(source.size / totalChunks);
  } else {
    // SOPHON scopes idempotency keys per-route. createUpload and
    // completeUpload are different routes, so a single key on both
    // returns 409. Derive distinct per-route keys from the caller's
    // (or auto-generated) seed so retries still work.
    const session = await api.createUpload({
      createUploadRequest: {
        file_name: fileName,
        file_size: source.size,
        mime_type: mimeType,
      },
      idempotencyKey: `${idempotencyKey}/create`,
    });
    uploadId = session.id;
    chunkSize = session.chunk_size;
    totalChunks = session.total_chunks;
  }

  const progress: UploadProgress = {
    bytesUploaded: 0,
    bytesTotal: source.size,
    partsDone: 0,
    partsTotal: totalChunks,
  };

  // Seed progress from any resumed parts so callers see accurate counts.
  for (const part of alreadyReceived) {
    progress.partsDone += 1;
    progress.bytesUploaded += partBytes(source.size, chunkSize, totalChunks, part);
  }
  onProgress?.({ ...progress });

  const pending: number[] = [];
  for (let i = 0; i < totalChunks; i++) {
    if (!alreadyReceived.has(i)) pending.push(i);
  }

  let nextIdx = 0;
  const workers: Promise<void>[] = [];

  for (let w = 0; w < Math.min(concurrency, pending.length); w++) {
    workers.push(
      (async () => {
        while (true) {
          if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
          const idx = nextIdx++;
          if (idx >= pending.length) return;

          const partNumber = pending[idx]!;
          const start = partNumber * chunkSize;
          const end = Math.min(start + chunkSize, source.size);
          const chunk = source.slice(start, end, "application/octet-stream");

          await withRetry(
            () => api.uploadPart({ id: uploadId, partNumber, body: chunk }),
            retries,
            retryBaseMs,
            signal,
          );

          progress.partsDone += 1;
          progress.bytesUploaded += chunk.size;
          onProgress?.({ ...progress });
        }
      })(),
    );
  }

  await Promise.all(workers);

  const done = await api.completeUpload({
    id: uploadId,
    idempotencyKey: `${idempotencyKey}/complete`,
  });

  return { uploadId: done.id, sha256: done.sha256, bytes: done.bytes };
}

function partBytes(total: number, chunkSize: number, totalChunks: number, part: number): number {
  if (part < totalChunks - 1) return chunkSize;
  return total - chunkSize * (totalChunks - 1);
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number,
  baseMs: number,
  signal: AbortSignal | undefined,
): Promise<T> {
  let attempt = 0;
  // One initial try + `retries` follow-ups.
  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (signal?.aborted) throw err;
      if (attempt >= retries || !isRetryable(err)) throw err;
      const delay = baseMs * 2 ** attempt + Math.floor(Math.random() * baseMs);
      await sleep(delay, signal);
      attempt += 1;
    }
  }
}

function isRetryable(err: unknown): boolean {
  if (err instanceof TypeError) return true; // network-level fetch errors
  const maybeResponse = (err as { response?: { status?: number } }).response;
  const status = maybeResponse?.status;
  if (typeof status !== "number") return false;
  return status === 408 || status === 429 || (status >= 500 && status < 600);
}

function sleep(ms: number, signal: AbortSignal | undefined): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function coerceUploadSource(source: UploadSource, mimeType: string): Promise<Blob> {
  // Already a Blob (or File, which extends Blob). Pass through.
  if (typeof Blob !== "undefined" && source instanceof Blob) return source;

  if (source instanceof Uint8Array) {
    return new Blob([source as BlobPart], { type: mimeType });
  }
  if (source instanceof ArrayBuffer) {
    return new Blob([new Uint8Array(source) as BlobPart], { type: mimeType });
  }
  if (typeof source === "string") {
    return await readPathToBlob(source, mimeType);
  }
  if (typeof source === "object" && source !== null) {
    if ("path" in source && typeof source.path === "string") {
      return await readPathToBlob(source.path, mimeType);
    }
    if ("data" in source) {
      const d = source.data;
      if (d instanceof Uint8Array) return new Blob([d as BlobPart], { type: mimeType });
      if (d instanceof ArrayBuffer) return new Blob([new Uint8Array(d) as BlobPart], { type: mimeType });
    }
  }
  throw new TypeError(
    "uploadFile: source must be a Blob, Uint8Array, ArrayBuffer, file path, " +
      "or { path } / { data } object",
  );
}

async function readPathToBlob(path: string, mimeType: string): Promise<Blob> {
  // Lazy-load `node:fs/promises` so this module stays usable in the browser.
  // Browsers passing a string source will hit this error — which is the
  // right behavior; they should pass a `File` or `Blob` instead.
  let readFile: (p: string) => Promise<Uint8Array>;
  try {
    // Indirect import keeps the bundler from resolving node:fs/promises in a
    // browser build, and the cast keeps us off @types/node here.
    const dyn = new Function("m", "return import(m)") as (m: string) => Promise<any>;
    const mod = await dyn("node:fs/promises");
    readFile = mod.readFile as (p: string) => Promise<Uint8Array>;
  } catch {
    throw new TypeError(
      "uploadFile: string sources are only supported in Node (node:fs/promises unavailable). " +
        "Pass a Blob or Uint8Array instead.",
    );
  }
  const bytes = await readFile(path);
  return new Blob([bytes as BlobPart], { type: mimeType });
}

function randomIdempotencyKey(): string {
  // Single capture of the global `crypto` object so the TS narrowing from
  // one `in` check doesn't bleed into the next branch.
  const c =
    typeof crypto !== "undefined"
      ? (crypto as unknown as {
          randomUUID?: () => string;
          getRandomValues?: (arr: Uint8Array) => Uint8Array;
        })
      : undefined;

  if (c?.randomUUID) return c.randomUUID();

  // Fallback for very old runtimes without crypto.randomUUID. Web Crypto's
  // getRandomValues has been in Node since 15 and all evergreen browsers, so
  // this almost never runs — but we avoid Math.random so idempotency keys
  // stay uncorrelated across callers even on ancient targets.
  if (c?.getRandomValues) {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    let hex = "";
    for (const b of bytes) hex += b.toString(16).padStart(2, "0");
    return `idem_${hex}`;
  }

  throw new Error(
    "crypto API unavailable; pass an explicit idempotencyKey to uploadFile",
  );
}
