/* tslint:disable */
/* eslint-disable */
/**
 * SOPHON Encoding API
 * REST API for submitting, monitoring, and retrieving SOPHON encoding jobs.  Authentication is via Bearer API key or session cookie. All POST endpoints require an Idempotency-Key header. List endpoints use opaque cursor-based pagination.  ---  ## Integration example  A real-world walkthrough of how [Daisy](https://daisy.so) wires SOPHON into two production flows — user-uploaded video compression and automatic post-generation encoding after video rendering. Both converge on the same adapter and state machine; only the source differs.  The patterns below are the ones that transfer cleanly to any integration.  ### 1. One thin adapter, one method per endpoint  Keep the HTTP surface boring. Axios (or your stack\'s equivalent), a per-endpoint idempotency key, and no enum for profile names:  ```ts @Injectable() export class SophonService {   private client() {     return axios.create({       baseURL: process.env.SOPHON_BASE_URL,       headers: { Authorization: `Bearer ${process.env.SOPHON_API_KEY}` },       timeout: 60_000,     });   }    async createUploadSession(req, idempotencyKey) { /_* POST /v1/uploads *_/ }   async uploadChunk(uploadId, partNumber, bytes) { /_* PUT /v1/uploads/{id}/parts/{n} *_/ }   async completeUpload(uploadId, idempotencyKey) { /_* POST /v1/uploads/{id}/complete *_/ }   async createJob(req, idempotencyKey) { /_* POST /v1/jobs *_/ }   async getJob(id) { /_* GET /v1/jobs/{id} *_/ }   async downloadOutputStream(jobId) { /_* GET /v1/jobs/{id}/output *_/ } } ```  **Suffix idempotency keys per endpoint.** SOPHON scopes dedupe per route but a shared key collides across retries that hit different endpoints. Do this:  ```ts const base = `video:${video.id}:v1`; await sophon.createUploadSession(req,  `${base}:create-upload`); await sophon.completeUpload(uploadId,  `${base}:complete-upload`); await sophon.createJob(req,            `${base}:create-job`); ```  **Profile names are strings, not an enum.** We add and rename profiles (`sophon-espresso` → `sophon-auto` → future variants). A TypeScript union will drift; let the server validate.  ### 2. Model your pipeline as a state machine  Persist a single `sophonState` JSON column per row. `jobId === null` routes to dispatch; anything else polls that job:  ```ts interface SophonState {   jobId: string | null;          // null = not dispatched; string = poll it   uploadId?: string;             // persist between upload + createJob   profile?: string;              // sophon-auto | sophon-espresso | ...   dispatchRetries: number;       // 3 strikes → fallback   downloadRetries: number;   lastError?: { stage, code, message, at }; }  // In your cron (5-second tick is plenty): if (state.jobId === null) {   await dispatch(video, state);  // upload + createJob } else {   await poll(video, state);      // getJob + (if completed) downloadAndComplete } ```  Persisting `uploadId` between the upload completion and the `createJob` call matters — a crash in that window otherwise re-uploads the file.  ### 3. Stream for large sources; buffer for small  User-uploaded sources can be 1 GB+. Stream S3 → SOPHON in chunks equal to `session.chunk_size` from the createUploadSession response:  ```ts async uploadStream(stream, fileName, mimeType, fileSize) {   const session = await this.createUploadSession({     file_name: fileName, file_size: fileSize, mime_type: mimeType,   });   let partIndex = 0, buffer = Buffer.alloc(0);   for await (const chunk of stream) {     buffer = Buffer.concat([buffer, chunk]);     while (buffer.length >= session.chunk_size) {       await this.uploadChunk(session.id, partIndex++,         buffer.subarray(0, session.chunk_size));       buffer = buffer.subarray(session.chunk_size);     }   }   if (buffer.length > 0) {     await this.uploadChunk(session.id, partIndex, buffer);   }   return this.completeUpload(session.id); } ```  Generated outputs from a model run are typically <30 MB — for those, a buffered upload path is simpler and avoids managing a stream lifetime.  ### 4. Always keep a fallback URL  Before a row enters your encoding state, make sure the source is already playable from your CDN. Every SOPHON failure then degrades to \"use the original\" — the user\'s video never disappears because SOPHON is slow or down. This is the single most important invariant:  ```ts await videoRepository.update({ id: video.id }, {   videoUrl: sourceCloudfrontUrl,   // fallback URL, stays intact   status: VideoStatus.EncodingPending,   sophonState: { jobId: null, profile, dispatchRetries: 0, downloadRetries: 0 },   sourceFileSize: sourceBytes, }); ```  On any terminal failure (structured `retryable: false`, retry budget exhausted, 404 on getJob, 23h stuck-row guard), flip status back to `Done` with `videoUrl` unchanged. SOPHON is enhancement, not a delivery dependency.  ### 5. Handle the \"no-gain\" success path  `sophon-auto` runs a pre-probe and, when it decides the output wouldn\'t be smaller than the source, returns `final_artifact: \"original\"` and `saved_percent: 0`. Skip the output download — the source already lives in your bucket:  ```ts if (job.status === \'completed\') {   if (job.final_artifact === \'original\') {     // Persist outputFileSize = sourceFileSize so your UI shows     // \"no reduction\" instead of a missing value.     await completeWithFallbackOutput(video, job.output?.bytes ?? null);     return;   }   await downloadAndComplete(video, state, job.output?.bytes ?? null); } ```  ### 6. Finalize by streaming into your own storage  `GET /v1/jobs/{id}/output` returns a 302 to a presigned URL with a 24h TTL. Stream that directly into your bucket — no temp file, no buffering:  ```ts const { stream } = await sophon.downloadOutputStream(state.jobId); const outputKey = `encoded/${video.userId}/${video.id}.mp4`; await fileService.uploadStream(outputKey, stream, \'video/mp4\'); await videoRepository.update({ id: video.id }, {   videoUrl: fileService.cloudfrontUrl(outputKey),   outputFileSize: sophonOutputBytes,   status: VideoStatus.Done, }); ```  ### 7. Failure taxonomy  | Error | Handling | |---|---| | Structured `retryable: false` from SOPHON | Terminal. Fall back to `Done` with source URL. | | Retryable upload / createJob failure | Increment `dispatchRetries`; after 3, fall back. | | Retryable download failure | Increment `downloadRetries`; after 3, fall back. | | `getJob` → HTTP 404 | Terminal. Job expired or never created. Fall back. | | Transient poll network error | Do nothing; next tick retries. Don\'t burn retry budget. | | Row stuck in encode state > 23h | Fall back (safety net against orphans). |  ### Minimal config  ```bash SOPHON_API_KEY=sk_live_... SOPHON_BASE_URL=https://api.liqhtworks.xyz ``` 
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { mapValues } from '../runtime';
import type { JobStatus } from './JobStatus';
import {
    JobStatusFromJSON,
    JobStatusFromJSONTyped,
    JobStatusToJSON,
    JobStatusToJSONTyped,
} from './JobStatus';
import type { JobSourceInfo } from './JobSourceInfo';
import {
    JobSourceInfoFromJSON,
    JobSourceInfoFromJSONTyped,
    JobSourceInfoToJSON,
    JobSourceInfoToJSONTyped,
} from './JobSourceInfo';
import type { JobProfile } from './JobProfile';
import {
    JobProfileFromJSON,
    JobProfileFromJSONTyped,
    JobProfileToJSON,
    JobProfileToJSONTyped,
} from './JobProfile';
import type { JobOutputInfo } from './JobOutputInfo';
import {
    JobOutputInfoFromJSON,
    JobOutputInfoFromJSONTyped,
    JobOutputInfoToJSON,
    JobOutputInfoToJSONTyped,
} from './JobOutputInfo';
import type { JobProgress } from './JobProgress';
import {
    JobProgressFromJSON,
    JobProgressFromJSONTyped,
    JobProgressToJSON,
    JobProgressToJSONTyped,
} from './JobProgress';

/**
 * 
 * @export
 * @interface JobResponse
 */
export interface JobResponse {
    /**
     * 
     * @type {string}
     * @memberof JobResponse
     */
    id: string;
    /**
     * 
     * @type {JobStatus}
     * @memberof JobResponse
     */
    status: JobStatus;
    /**
     * 
     * @type {string}
     * @memberof JobResponse
     */
    status_reason?: string;
    /**
     * 
     * @type {number}
     * @memberof JobResponse
     */
    attempt: number;
    /**
     * Whether the job can still be retried (attempt < max_attempts and not terminal).
     * @type {boolean}
     * @memberof JobResponse
     */
    retryable: boolean;
    /**
     * Public profile ID submitted by the customer. For adaptive jobs this
     * stays `sophon-auto`; see `effective_profile_id` for the worker's
     * resolved concrete profile.
     * 
     * @type {JobProfile}
     * @memberof JobResponse
     */
    profile: JobProfile;
    /**
     * Concrete profile resolved by the worker. Omitted until dispatch
     * resolves. On explicit-profile jobs this equals `profile`. On
     * `sophon-auto` jobs this is a variant identifier recording
     * which path the API routed the source through; exact encoder
     * settings for a given variant may be updated between releases
     * as the adaptive logic is tuned.
     * 
     * @type {string}
     * @memberof JobResponse
     */
    effective_profile_id?: string;
    /**
     * 
     * @type {JobSourceInfo}
     * @memberof JobResponse
     */
    source: JobSourceInfo;
    /**
     * 
     * @type {JobProgress}
     * @memberof JobResponse
     */
    progress: JobProgress;
    /**
     * 
     * @type {JobOutputInfo}
     * @memberof JobResponse
     */
    output: JobOutputInfo;
    /**
     * Arbitrary JSON object attached to a job. Keys and values are passed
     * through unchanged to webhook deliveries and echoed on job reads. The
     * serialized representation must not exceed 16 KiB. Free-form; SDKs
     * surface this as a `Record<string, unknown>` / `dict[str, Any]` /
     * `map[string]interface{}` depending on language.
     * 
     * @type {{ [key: string]: any; }}
     * @memberof JobResponse
     */
    metadata: { [key: string]: any; };
    /**
     * 
     * @type {Date}
     * @memberof JobResponse
     */
    created_at: Date;
    /**
     * 
     * @type {Date}
     * @memberof JobResponse
     */
    started_at?: Date;
    /**
     * 
     * @type {Date}
     * @memberof JobResponse
     */
    completed_at?: Date;
    /**
     * 
     * @type {string}
     * @memberof JobResponse
     */
    error?: string;
}



/**
 * Check if a given object implements the JobResponse interface.
 */
export function instanceOfJobResponse(value: object): value is JobResponse {
    if (!('id' in value) || value['id'] === undefined) return false;
    if (!('status' in value) || value['status'] === undefined) return false;
    if (!('attempt' in value) || value['attempt'] === undefined) return false;
    if (!('retryable' in value) || value['retryable'] === undefined) return false;
    if (!('profile' in value) || value['profile'] === undefined) return false;
    if (!('source' in value) || value['source'] === undefined) return false;
    if (!('progress' in value) || value['progress'] === undefined) return false;
    if (!('output' in value) || value['output'] === undefined) return false;
    if (!('metadata' in value) || value['metadata'] === undefined) return false;
    if (!('created_at' in value) || value['created_at'] === undefined) return false;
    return true;
}

export function JobResponseFromJSON(json: any): JobResponse {
    return JobResponseFromJSONTyped(json, false);
}

export function JobResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): JobResponse {
    if (json == null) {
        return json;
    }
    return {
        
        'id': json['id'],
        'status': JobStatusFromJSON(json['status']),
        'status_reason': json['status_reason'] == null ? undefined : json['status_reason'],
        'attempt': json['attempt'],
        'retryable': json['retryable'],
        'profile': JobProfileFromJSON(json['profile']),
        'effective_profile_id': json['effective_profile_id'] == null ? undefined : json['effective_profile_id'],
        'source': JobSourceInfoFromJSON(json['source']),
        'progress': JobProgressFromJSON(json['progress']),
        'output': JobOutputInfoFromJSON(json['output']),
        'metadata': json['metadata'],
        'created_at': (new Date(json['created_at'])),
        'started_at': json['started_at'] == null ? undefined : (new Date(json['started_at'])),
        'completed_at': json['completed_at'] == null ? undefined : (new Date(json['completed_at'])),
        'error': json['error'] == null ? undefined : json['error'],
    };
}

export function JobResponseToJSON(json: any): JobResponse {
    return JobResponseToJSONTyped(json, false);
}

export function JobResponseToJSONTyped(value?: JobResponse | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'id': value['id'],
        'status': JobStatusToJSON(value['status']),
        'status_reason': value['status_reason'],
        'attempt': value['attempt'],
        'retryable': value['retryable'],
        'profile': JobProfileToJSON(value['profile']),
        'effective_profile_id': value['effective_profile_id'],
        'source': JobSourceInfoToJSON(value['source']),
        'progress': JobProgressToJSON(value['progress']),
        'output': JobOutputInfoToJSON(value['output']),
        'metadata': value['metadata'],
        'created_at': value['created_at'].toISOString(),
        'started_at': value['started_at'] == null ? value['started_at'] : value['started_at'].toISOString(),
        'completed_at': value['completed_at'] == null ? value['completed_at'] : value['completed_at'].toISOString(),
        'error': value['error'],
    };
}

