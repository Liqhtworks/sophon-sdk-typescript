// Cross-cutting middleware for the generated API surface.
//
// The generated `BaseAPI.fetchApi` runs an ordered list of `Middleware`
// hooks around each request. These helpers slot in via
// `Configuration({ middleware: [...] })` and give every endpoint
// (createJob, getJob, listJobs, etc.) the same retry/timeout behavior
// that `uploadFile` already gets internally.

import type { Middleware } from "../runtime";

export interface RetryOptions {
  /** Max attempts (initial + retries). Default 4. */
  maxAttempts?: number;
  /** Base backoff in ms; doubles each attempt. Default 500. */
  baseMs?: number;
  /** Cap on backoff in ms. Default 15_000. */
  maxBackoffMs?: number;
  /** Predicate to decide whether a given response is retryable.
   *  Default: 408 / 429 / 5xx for safe methods, plus POST/PUT/DELETE that
   *  carry an `Idempotency-Key` header. */
  isRetryable?: (status: number, method: string, headers: Headers) => boolean;
}

/**
 * Retries 408 / 429 / 5xx responses (and `TypeError` network failures) on
 * every API call, not just chunk uploads. POSTs are retried only when an
 * `Idempotency-Key` header is set, matching the server's dedupe contract.
 *
 * Honors `Retry-After` on 429 / 503.
 */
export function withRetry(opts: RetryOptions = {}): Middleware {
  const {
    maxAttempts = 4,
    baseMs = 500,
    maxBackoffMs = 15_000,
    isRetryable = defaultIsRetryable,
  } = opts;

  async function attemptRetry(
    fetchFn: typeof fetch,
    url: string,
    init: RequestInit,
    response: Response | undefined,
    attempt: number,
  ): Promise<Response | undefined> {
    if (attempt >= maxAttempts) return response;

    const method = (init.method || "GET").toUpperCase();
    const headers = new Headers((init.headers as any) || {});

    if (response) {
      if (response.status < 400) return response;
      if (!isRetryable(response.status, method, headers)) return response;
    }

    let delay = Math.min(baseMs * 2 ** (attempt - 1), maxBackoffMs);
    if (response) {
      const ra = response.headers.get("retry-after");
      if (ra) {
        const n = Number(ra);
        if (Number.isFinite(n)) delay = Math.max(delay, n * 1000);
      }
    }
    delay += Math.floor(Math.random() * baseMs);

    await new Promise((r) => setTimeout(r, delay));

    let next: Response | undefined;
    try {
      next = await fetchFn(url, init);
    } catch (err) {
      if (!(err instanceof TypeError)) throw err;
      // Network error — try again until budget runs out.
      return attemptRetry(fetchFn, url, init, undefined, attempt + 1);
    }
    if (next.status < 400 || !isRetryable(next.status, method, headers)) return next;
    return attemptRetry(fetchFn, url, init, next, attempt + 1);
  }

  return {
    post: async (ctx) => {
      const response = ctx.response;
      if (response.status < 400) return undefined;
      const method = (ctx.init.method || "GET").toUpperCase();
      const headers = new Headers((ctx.init.headers as any) || {});
      if (!isRetryable(response.status, method, headers)) return undefined;
      const next = await attemptRetry(ctx.fetch as typeof fetch, ctx.url, ctx.init, response, 1);
      return next;
    },
    onError: async (ctx) => {
      if (!(ctx.error instanceof TypeError)) return undefined;
      return await attemptRetry(ctx.fetch as typeof fetch, ctx.url, ctx.init, undefined, 1);
    },
  };
}

function defaultIsRetryable(status: number, method: string, headers: Headers): boolean {
  if (status !== 408 && status !== 429 && !(status >= 500 && status < 600)) return false;
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return true;
  return headers.has("idempotency-key") || headers.has("Idempotency-Key");
}

/**
 * Per-request network timeout. Wraps fetch with an `AbortController` so a
 * stalled connection aborts after `timeoutMs` instead of hanging on the
 * OS-level TCP timeout (~minutes).
 */
export function withTimeout(timeoutMs: number): Middleware {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new RangeError("withTimeout: timeoutMs must be a positive number");
  }
  return {
    pre: async (ctx) => {
      const existing = ctx.init.signal as AbortSignal | null | undefined;
      const ctrl = new AbortController();
      const t = setTimeout(
        () => ctrl.abort(new DOMException(`Request timed out after ${timeoutMs}ms`, "TimeoutError")),
        timeoutMs,
      );
      if (existing) {
        if (existing.aborted) ctrl.abort((existing as any).reason);
        else existing.addEventListener("abort", () => ctrl.abort((existing as any).reason), { once: true });
      }
      const init: RequestInit = { ...ctx.init, signal: ctrl.signal };
      (init as any).__sophonTimeoutHandle = t;
      return { url: ctx.url, init };
    },
    post: async (ctx) => {
      const t = (ctx.init as any).__sophonTimeoutHandle;
      if (t) clearTimeout(t);
      return undefined;
    },
    onError: async (ctx) => {
      const t = (ctx.init as any).__sophonTimeoutHandle;
      if (t) clearTimeout(t);
      return undefined;
    },
  };
}
