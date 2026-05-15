// First-class download helper, mirroring `uploadFile` on the upload side.
//
// The generated `JobsApi.getJobOutput` is `Promise<void>` because the route
// returns a 302 redirect that the generator can't model. This helper drives
// the redirect dance manually:
//
//   1. `GET {basePath}/v1/jobs/{id}/output` with `redirect: "manual"` so we
//      can read the `Location` header for the 24h presigned URL.
//   2. `GET <presigned URL>` to actually stream the bytes.
//
// Returns the presigned response so callers can stream into their own storage,
// `arrayBuffer()` for tests, or pipe through `Response.body` (Web ReadableStream).

import type { Configuration } from "../runtime";

export interface DownloadOutputParams {
  /** The Configuration you handed to `JobsApi`. Used for basePath + auth. */
  config: Configuration;
  /** ID of the completed job whose output you want. */
  jobId: string;
  /** Override fetch (matches `Configuration.fetchApi` contract). */
  fetchApi?: typeof fetch;
  /** Optional cancellation signal — aborts both the redirect lookup
   *  and the presigned-URL request. */
  signal?: AbortSignal;
}

export interface DownloadOutputResult {
  /** The presigned-URL response; consume with `.body`, `.arrayBuffer()`, etc. */
  response: Response;
  /** The presigned URL the bytes were fetched from (24h TTL). */
  url: string;
  /** Convenience: total bytes if the response advertises a Content-Length. */
  bytes: number | undefined;
}

/**
 * Drives the SOPHON two-step output download. Resolves once the presigned
 * URL has returned a successful response; bytes are NOT buffered. Stream
 * `result.response.body` into your storage or call `arrayBuffer()` for tests.
 */
export async function downloadJobOutput(
  params: DownloadOutputParams,
): Promise<DownloadOutputResult> {
  const { config, jobId, fetchApi, signal } = params;
  if (!jobId) throw new TypeError("downloadJobOutput: jobId is required");

  const doFetch: typeof fetch = (fetchApi ?? config.fetchApi ?? fetch) as typeof fetch;
  const base = config.basePath.replace(/\/+$/, "");
  const headers: Record<string, string> = {};
  // Reuse the Configuration's accessToken (bearer API key).
  const tokenAccessor = (config as any).accessToken;
  if (tokenAccessor) {
    const t =
      typeof tokenAccessor === "function"
        ? await tokenAccessor("bearerApiKey", [])
        : await tokenAccessor;
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }

  const redirect = await doFetch(`${base}/v1/jobs/${encodeURIComponent(jobId)}/output`, {
    method: "GET",
    headers,
    redirect: "manual",
    signal,
  });

  // Fetch may either return status 302 (with Location header) or already
  // follow the redirect depending on runtime semantics. Handle both.
  if (redirect.ok) {
    const len = redirect.headers.get("content-length");
    return { response: redirect, url: redirect.url, bytes: len ? Number(len) : undefined };
  }

  const location = redirect.headers.get("location");
  if (!location) {
    throw new Error(
      `downloadJobOutput: expected 302 redirect for job ${jobId}, got ${redirect.status}`,
    );
  }
  const presignedUrl = new URL(location, base).toString();
  const download = await doFetch(presignedUrl, { method: "GET", signal });
  if (!download.ok) {
    throw new Error(
      `downloadJobOutput: presigned URL fetch failed (${download.status}) for job ${jobId}`,
    );
  }
  const len = download.headers.get("content-length");
  return { response: download, url: presignedUrl, bytes: len ? Number(len) : undefined };
}

/**
 * Convenience wrapper: drive the redirect, buffer the bytes, return a Buffer
 * (Node) or `Uint8Array` (browser). Use only for small outputs — for video
 * files, prefer `downloadJobOutput` and stream `response.body`.
 */
export async function downloadJobOutputBytes(
  params: DownloadOutputParams,
): Promise<Uint8Array> {
  const { response } = await downloadJobOutput(params);
  const buf = await response.arrayBuffer();
  return new Uint8Array(buf);
}
