// Typed error hierarchy on top of the generated ResponseError.
//
// The generated runtime throws a single `ResponseError` for every non-2xx
// response, with the raw `Response` on `.response`. Consumers had to clone
// the response and parse the JSON envelope themselves to find out which
// error class they were dealing with. This file:
//
//   - Defines a subclass per HTTP category (auth, rate-limit, validation,
//     not-found, server) plus a generic `SophonApiError`.
//   - Provides `parseSophonError(err)` to convert a `ResponseError` into one
//     of the typed subclasses by inspecting `err.response.status` and the
//     `{ error: { code, message, retryable, request_id } }` envelope.
//   - Provides `withTypedErrors()` middleware that you can register on the
//     generated `Configuration` so calls throw the typed subclass directly.
//
// Backwards compatible: every typed subclass still extends `ResponseError`,
// so existing `instanceof ResponseError` checks keep working.

import { ResponseError, type Middleware } from "../runtime";

export interface SophonErrorBody {
  code?: string;
  message?: string;
  retryable?: boolean;
  request_id?: string;
}

/** Base class for all parsed Sophon API errors. Extends ResponseError so
 *  existing `instanceof ResponseError` catches still match. */
export class SophonApiError extends ResponseError {
  override name: any = "SophonApiError";
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly retryable?: boolean;
  readonly body?: SophonErrorBody;

  constructor(response: Response, body: SophonErrorBody | undefined, message: string) {
    super(response, message);
    this.status = response.status;
    this.code = body?.code;
    this.requestId = body?.request_id;
    this.retryable = body?.retryable;
    this.body = body;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthenticationError extends SophonApiError {
  override name: any = "AuthenticationError";
}
export class PermissionDeniedError extends SophonApiError {
  override name: any = "PermissionDeniedError";
}
export class NotFoundError extends SophonApiError {
  override name: any = "NotFoundError";
}
export class ConflictError extends SophonApiError {
  override name: any = "ConflictError";
}
export class ValidationError extends SophonApiError {
  override name: any = "ValidationError";
}
export class RateLimitError extends SophonApiError {
  override name: any = "RateLimitError";
  readonly retryAfterMs?: number;
  constructor(response: Response, body: SophonErrorBody | undefined, message: string) {
    super(response, body, message);
    const ra = response.headers.get("retry-after");
    if (ra) {
      const n = Number(ra);
      if (Number.isFinite(n)) this.retryAfterMs = n * 1000;
      else {
        const ts = Date.parse(ra);
        if (!Number.isNaN(ts)) this.retryAfterMs = Math.max(0, ts - Date.now());
      }
    }
  }
}
export class ServerError extends SophonApiError {
  override name: any = "ServerError";
}

/** Specialized form of `NotFoundError` for `getJob` 404s. Surfaces the jobId
 *  the caller asked for so consumers can switch on it directly. */
export class JobNotFoundError extends NotFoundError {
  override name: any = "JobNotFoundError";
  readonly jobId: string;
  constructor(response: Response, body: SophonErrorBody | undefined, jobId: string) {
    super(response, body, `job ${jobId} not found`);
    this.jobId = jobId;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

async function readBody(response: Response): Promise<SophonErrorBody | undefined> {
  try {
    const text = await response.clone().text();
    if (!text) return undefined;
    const parsed = JSON.parse(text);
    // Server uses `{ error: { code, message, retryable, request_id } }`
    // envelope on every 4xx/5xx. Accept either shape.
    if (parsed && typeof parsed === "object") {
      if (parsed.error && typeof parsed.error === "object") return parsed.error as SophonErrorBody;
      return parsed as SophonErrorBody;
    }
  } catch {
    // not JSON — leave body undefined
  }
  return undefined;
}

/**
 * Convert a raw `ResponseError` into a typed `SophonApiError` subclass.
 * If `err` is not a `ResponseError`, it's returned unchanged.
 *
 * This is async because we need to read the response body. Callers in a
 * sync catch block can use `parseSophonErrorSync(err, body)` if they have
 * already buffered the body.
 */
export async function parseSophonError(err: unknown): Promise<unknown> {
  if (!(err instanceof ResponseError)) return err;
  if (err instanceof SophonApiError) return err;
  const body = await readBody(err.response);
  return buildTyped(err.response, body);
}

export function parseSophonErrorSync(
  response: Response,
  body: SophonErrorBody | undefined,
): SophonApiError {
  return buildTyped(response, body);
}

function buildTyped(response: Response, body: SophonErrorBody | undefined): SophonApiError {
  const status = response.status;
  const message = body?.message || `HTTP ${status}`;
  if (status === 401) return new AuthenticationError(response, body, message);
  if (status === 403) return new PermissionDeniedError(response, body, message);
  if (status === 404) return new NotFoundError(response, body, message);
  if (status === 409) return new ConflictError(response, body, message);
  if (status === 422 || status === 400) return new ValidationError(response, body, message);
  if (status === 429) return new RateLimitError(response, body, message);
  if (status >= 500) return new ServerError(response, body, message);
  return new SophonApiError(response, body, message);
}

/**
 * Middleware that converts every non-2xx response into a typed
 * `SophonApiError` subclass. Register on `Configuration.middleware`:
 *
 * ```ts
 * const config = new Configuration({
 *   accessToken: process.env.SOPHON_API_KEY,
 *   middleware: [withTypedErrors()],
 * });
 * ```
 */
export function withTypedErrors(): Middleware {
  return {
    post: async (ctx) => {
      const { response } = ctx;
      if (response.status >= 200 && response.status < 300) return undefined;
      const body = await readBody(response);
      throw buildTyped(response, body);
    },
  };
}
