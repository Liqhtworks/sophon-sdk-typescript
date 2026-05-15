// Polling helper that resolves when a job hits a terminal state, plus a
// flat-options `createJob` convenience that flattens the generated
// nested `{ idempotencyKey, createJobRequest }` shape.

import { ResponseError } from "../runtime";
import { JobNotFoundError, parseSophonError } from "./errors";

export type JobTerminalStatus = "completed" | "failed" | "canceled";
export type JobStatusLike = JobTerminalStatus | "queued" | "probing" | "encoding" | "muxing" | "uploading_output";

/** Structured failure body the server attaches to terminal jobs. Mirrors
 *  the generated `ErrorBody` model, redefined here so the helper layer
 *  doesn't pull in the full model graph. */
export interface JobErrorBodyLike {
  code?: string;
  message?: string;
  retryable?: boolean;
  request_id?: string;
}

export interface JobLike {
  id: string;
  status: JobStatusLike;
  /** Either a structured `ErrorBody` (current server contract) or a plain
   *  string (older payloads). `null`/`undefined` on non-terminal states. */
  error?: JobErrorBodyLike | string | null;
}

export interface JobsApiLike {
  getJob(params: { id: string }): Promise<JobLike>;
}

export interface WaitForJobParams<T extends JobLike = JobLike> {
  api: { getJob: (p: { id: string }) => Promise<T> };
  jobId: string;
  /** Resolve only on these statuses. Default: the three terminal ones. */
  until?: readonly JobStatusLike[];
  /** Initial poll interval (ms). Default 1000. */
  pollMinMs?: number;
  /** Cap on poll interval (ms). Default 15000. */
  pollMaxMs?: number;
  /** Exponential backoff multiplier per poll. Default 1.5. */
  pollBackoff?: number;
  /** Abort and throw after this many ms. Default 3600000 (1h). */
  timeoutMs?: number;
  /** Called on every poll with the freshly fetched job. */
  onProgress?: (job: T) => void;
  signal?: AbortSignal;
}

function formatJobError(err: JobErrorBodyLike | string | null | undefined): string | null {
  if (err == null) return null;
  if (typeof err === "string") return err;
  if (err.message) {
    return err.code ? `${err.code}: ${err.message}` : err.message;
  }
  if (err.code) return err.code;
  try {
    return JSON.stringify(err);
  } catch {
    return null;
  }
}

export class JobTerminalError<T extends JobLike = JobLike> extends Error {
  readonly job: T;
  readonly code?: string;
  readonly requestId?: string;
  readonly retryable?: boolean;

  constructor(job: T) {
    const formatted = formatJobError(job.error);
    super(formatted ?? `job ${job.id} ended in status ${job.status}`);
    this.name = "JobTerminalError";
    this.job = job;
    if (job.error && typeof job.error === "object") {
      this.code = job.error.code;
      this.requestId = job.error.request_id;
      this.retryable = job.error.retryable;
    }
  }
}

export class JobTimeoutError extends Error {
  readonly jobId: string;
  constructor(jobId: string, waitedMs: number) {
    super(`job ${jobId} did not finish within ${waitedMs}ms`);
    this.name = "JobTimeoutError";
    this.jobId = jobId;
  }
}

const DEFAULT_TERMINAL: readonly JobTerminalStatus[] = ["completed", "failed", "canceled"];

/**
 * Polls `getJob` until the job hits a terminal status (or the requested
 * `until` list), then returns the final job. Throws `JobTerminalError` on
 * `failed` / `canceled` unless those are explicitly requested in `until`.
 * Throws `JobTimeoutError` if the timeout elapses. A 404 from `getJob` is
 * surfaced as a typed `JobNotFoundError`.
 */
export async function waitForJob<T extends JobLike = JobLike>(
  params: WaitForJobParams<T>,
): Promise<T> {
  const {
    api,
    jobId,
    until = DEFAULT_TERMINAL,
    pollMinMs = 1000,
    pollMaxMs = 15000,
    pollBackoff = 1.5,
    timeoutMs = 60 * 60 * 1000,
    onProgress,
    signal,
  } = params;

  const start = Date.now();
  let interval = pollMinMs;

  while (true) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (Date.now() - start > timeoutMs) throw new JobTimeoutError(jobId, Date.now() - start);

    let job: T;
    try {
      job = await api.getJob({ id: jobId });
    } catch (err) {
      if (err instanceof ResponseError && err.response.status === 404) {
        const parsed = (await parseSophonError(err)) as any;
        throw new JobNotFoundError(err.response, parsed?.body, jobId);
      }
      throw err;
    }
    onProgress?.(job);

    if (until.some((s) => s === job.status)) {
      if (until === DEFAULT_TERMINAL && (job.status === "failed" || job.status === "canceled")) {
        throw new JobTerminalError(job);
      }
      return job;
    }

    await sleep(interval, signal);
    interval = Math.min(Math.ceil(interval * pollBackoff), pollMaxMs);
  }
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

// ---------------------------------------------------------------------------
// Flat-options createJob helper
// ---------------------------------------------------------------------------

export interface CreateJobFlatParams<TSource = unknown, TProfile = unknown, TOutput = unknown> {
  api: {
    createJob(req: {
      idempotencyKey: string;
      createJobRequest: { source: TSource; profile: TProfile; output?: TOutput; webhook_url?: string | null };
    }): Promise<any>;
  };
  source: TSource;
  profile: TProfile;
  output?: TOutput;
  webhookUrl?: string | null;
  /** Auto-generated via Web Crypto if omitted. */
  idempotencyKey?: string;
}

/**
 * Flattens the nested `{ idempotencyKey, createJobRequest: {...} }` shape
 * the generated `JobsApi.createJob` requires. Callers write
 * `createJob({ source, profile })` instead of nesting twice.
 */
export async function createJob<TJob = unknown>(params: CreateJobFlatParams): Promise<TJob> {
  const { api, source, profile, output, webhookUrl, idempotencyKey } = params;
  const key = idempotencyKey ?? randomIdempotencyKey();
  const res = await api.createJob({
    idempotencyKey: key,
    createJobRequest: {
      source,
      profile,
      ...(output !== undefined ? { output } : {}),
      ...(webhookUrl !== undefined ? { webhook_url: webhookUrl } : {}),
    },
  });
  return res as TJob;
}

function randomIdempotencyKey(): string {
  const c = typeof crypto !== "undefined" ? (crypto as any) : undefined;
  if (c?.randomUUID) return c.randomUUID();
  if (c?.getRandomValues) {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    let hex = "";
    for (const b of bytes) hex += b.toString(16).padStart(2, "0");
    return `idem_${hex}`;
  }
  throw new Error("crypto API unavailable; pass an explicit idempotencyKey to createJob");
}
