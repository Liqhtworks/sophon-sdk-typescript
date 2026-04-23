// Polling helper that resolves when a job hits a terminal state.

export type JobTerminalStatus = "completed" | "failed" | "canceled";
export type JobStatusLike = JobTerminalStatus | "queued" | "probing" | "encoding" | "muxing" | "uploading_output";

export interface JobLike {
  id: string;
  status: JobStatusLike;
  error?: string | null;
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

export class JobTerminalError<T extends JobLike = JobLike> extends Error {
  readonly job: T;
  constructor(job: T) {
    super(job.error ?? `job ${job.id} ended in status ${job.status}`);
    this.name = "JobTerminalError";
    this.job = job;
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
 * Throws `JobTimeoutError` if the timeout elapses.
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

    const job = await api.getJob({ id: jobId });
    onProgress?.(job);

    if (until.some((s) => s === job.status)) {
      // The caller opted into this status; only synthesize a JobTerminalError
      // when they are waiting for the default-terminal set and we landed on a
      // failed/canceled status.
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
