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


import * as runtime from '../runtime';
import type {
  CreateJobRequest,
  ErrorEnvelope,
  JobResponse,
  JobStatus,
  ListJobsResponse,
} from '../models/index';
import {
    CreateJobRequestFromJSON,
    CreateJobRequestToJSON,
    ErrorEnvelopeFromJSON,
    ErrorEnvelopeToJSON,
    JobResponseFromJSON,
    JobResponseToJSON,
    JobStatusFromJSON,
    JobStatusToJSON,
    ListJobsResponseFromJSON,
    ListJobsResponseToJSON,
} from '../models/index';

export interface CancelJobRequest {
    id: string;
}

export interface CreateJobOperationRequest {
    idempotencyKey: string;
    createJobRequest: CreateJobRequest;
}

export interface GetJobRequest {
    id: string;
}

export interface GetJobOutputRequest {
    id: string;
}

export interface ListJobsRequest {
    status?: JobStatus;
    limit?: number;
    cursor?: string;
}

/**
 * JobsApi - interface
 * 
 * @export
 * @interface JobsApiInterface
 */
export interface JobsApiInterface {
    /**
     * Creates request options for cancelJob without sending the request
     * @param {string} id 
     * @throws {RequiredError}
     * @memberof JobsApiInterface
     */
    cancelJobRequestOpts(requestParameters: CancelJobRequest): Promise<runtime.RequestOpts>;

    /**
     * Cancels a job in a non-terminal state (queued, probing, encoding, muxing, uploading_output). Returns 409 if the job is already completed, failed, or canceled. 
     * @summary Cancel a job
     * @param {string} id 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof JobsApiInterface
     */
    cancelJobRaw(requestParameters: CancelJobRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<JobResponse>>;

    /**
     * Cancels a job in a non-terminal state (queued, probing, encoding, muxing, uploading_output). Returns 409 if the job is already completed, failed, or canceled. 
     * Cancel a job
     */
    cancelJob(requestParameters: CancelJobRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<JobResponse>;

    /**
     * Creates request options for createJob without sending the request
     * @param {string} idempotencyKey Client-generated UUID or string for exactly-once semantics. Required on all POST endpoints. Replaying the same key with the same request body returns the original response without side effects. 
     * @param {CreateJobRequest} createJobRequest 
     * @throws {RequiredError}
     * @memberof JobsApiInterface
     */
    createJobRequestOpts(requestParameters: CreateJobOperationRequest): Promise<runtime.RequestOpts>;

    /**
     * Creates a queued encoding job from a completed upload source.  **Picking `profile`:** - Use `sophon-auto` unless you have a specific reason not to. It   picks per-source settings tuned for consistent output and   re-encodes at stricter settings if the first pass doesn\'t   hold up. - Use an explicit coffee profile (`sophon-espresso` / `-cortado` /   `-americano`) when you want deterministic encoder behavior —   same settings regardless of source. - Use an `-hq` variant when the source is a heavy format   (ProRes, DNxHD, high-bitrate camera originals). Larger output   files, maximum detail preservation. - Use an `-hq-10bit` variant when the source is 10-bit and you   want to preserve that depth end-to-end (ProRes 422/4444,   DNxHD, BRAW, camera masters).  See `JobProfile` for the full enum.  `output.target_height` requests an aspect-preserving downscale (width derived from source, both dims rounded to even). If absent or larger than source, output uses source dimensions. 
     * @summary Submit an encoding job
     * @param {string} idempotencyKey Client-generated UUID or string for exactly-once semantics. Required on all POST endpoints. Replaying the same key with the same request body returns the original response without side effects. 
     * @param {CreateJobRequest} createJobRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof JobsApiInterface
     */
    createJobRaw(requestParameters: CreateJobOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<JobResponse>>;

    /**
     * Creates a queued encoding job from a completed upload source.  **Picking `profile`:** - Use `sophon-auto` unless you have a specific reason not to. It   picks per-source settings tuned for consistent output and   re-encodes at stricter settings if the first pass doesn\'t   hold up. - Use an explicit coffee profile (`sophon-espresso` / `-cortado` /   `-americano`) when you want deterministic encoder behavior —   same settings regardless of source. - Use an `-hq` variant when the source is a heavy format   (ProRes, DNxHD, high-bitrate camera originals). Larger output   files, maximum detail preservation. - Use an `-hq-10bit` variant when the source is 10-bit and you   want to preserve that depth end-to-end (ProRes 422/4444,   DNxHD, BRAW, camera masters).  See `JobProfile` for the full enum.  `output.target_height` requests an aspect-preserving downscale (width derived from source, both dims rounded to even). If absent or larger than source, output uses source dimensions. 
     * Submit an encoding job
     */
    createJob(requestParameters: CreateJobOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<JobResponse>;

    /**
     * Creates request options for getJob without sending the request
     * @param {string} id 
     * @throws {RequiredError}
     * @memberof JobsApiInterface
     */
    getJobRequestOpts(requestParameters: GetJobRequest): Promise<runtime.RequestOpts>;

    /**
     * Returns current job state, progress, source metadata, resolved adaptive profile information, and output availability for one job. 
     * @summary Get a single job by ID
     * @param {string} id 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof JobsApiInterface
     */
    getJobRaw(requestParameters: GetJobRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<JobResponse>>;

    /**
     * Returns current job state, progress, source metadata, resolved adaptive profile information, and output availability for one job. 
     * Get a single job by ID
     */
    getJob(requestParameters: GetJobRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<JobResponse>;

    /**
     * Creates request options for getJobOutput without sending the request
     * @param {string} id 
     * @throws {RequiredError}
     * @memberof JobsApiInterface
     */
    getJobOutputRequestOpts(requestParameters: GetJobOutputRequest): Promise<runtime.RequestOpts>;

    /**
     * Returns a 302 redirect to a signed download URL for the job\'s output file. The signed URL is valid for 24 hours. 
     * @summary Get the encoded output file
     * @param {string} id 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof JobsApiInterface
     */
    getJobOutputRaw(requestParameters: GetJobOutputRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>>;

    /**
     * Returns a 302 redirect to a signed download URL for the job\'s output file. The signed URL is valid for 24 hours. 
     * Get the encoded output file
     */
    getJobOutput(requestParameters: GetJobOutputRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void>;

    /**
     * Creates request options for listJobs without sending the request
     * @param {JobStatus} [status] Filter by job status.
     * @param {number} [limit] Maximum number of items to return per page.
     * @param {string} [cursor] Opaque pagination cursor returned in a previous response\&#39;s &#x60;next_cursor&#x60; field.
     * @throws {RequiredError}
     * @memberof JobsApiInterface
     */
    listJobsRequestOpts(requestParameters: ListJobsRequest): Promise<runtime.RequestOpts>;

    /**
     * Returns jobs for the authenticated organization ordered by creation time, with optional status filtering and opaque cursor pagination. 
     * @summary List jobs with cursor pagination
     * @param {JobStatus} [status] Filter by job status.
     * @param {number} [limit] Maximum number of items to return per page.
     * @param {string} [cursor] Opaque pagination cursor returned in a previous response\&#39;s &#x60;next_cursor&#x60; field.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof JobsApiInterface
     */
    listJobsRaw(requestParameters: ListJobsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<ListJobsResponse>>;

    /**
     * Returns jobs for the authenticated organization ordered by creation time, with optional status filtering and opaque cursor pagination. 
     * List jobs with cursor pagination
     */
    listJobs(requestParameters: ListJobsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<ListJobsResponse>;

}

/**
 * 
 */
export class JobsApi extends runtime.BaseAPI implements JobsApiInterface {

    /**
     * Creates request options for cancelJob without sending the request
     */
    async cancelJobRequestOpts(requestParameters: CancelJobRequest): Promise<runtime.RequestOpts> {
        if (requestParameters['id'] == null) {
            throw new runtime.RequiredError(
                'id',
                'Required parameter "id" was null or undefined when calling cancelJob().'
            );
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("bearerApiKey", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }

        let urlPath = `/v1/jobs/{id}`;
        urlPath = urlPath.replace(`{${"id"}}`, encodeURIComponent(String(requestParameters['id'])));

        return {
            path: urlPath,
            method: 'DELETE',
            headers: headerParameters,
            query: queryParameters,
        };
    }

    /**
     * Cancels a job in a non-terminal state (queued, probing, encoding, muxing, uploading_output). Returns 409 if the job is already completed, failed, or canceled. 
     * Cancel a job
     */
    async cancelJobRaw(requestParameters: CancelJobRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<JobResponse>> {
        const requestOptions = await this.cancelJobRequestOpts(requestParameters);
        const response = await this.request(requestOptions, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => JobResponseFromJSON(jsonValue));
    }

    /**
     * Cancels a job in a non-terminal state (queued, probing, encoding, muxing, uploading_output). Returns 409 if the job is already completed, failed, or canceled. 
     * Cancel a job
     */
    async cancelJob(requestParameters: CancelJobRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<JobResponse> {
        const response = await this.cancelJobRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Creates request options for createJob without sending the request
     */
    async createJobRequestOpts(requestParameters: CreateJobOperationRequest): Promise<runtime.RequestOpts> {
        if (requestParameters['idempotencyKey'] == null) {
            throw new runtime.RequiredError(
                'idempotencyKey',
                'Required parameter "idempotencyKey" was null or undefined when calling createJob().'
            );
        }

        if (requestParameters['createJobRequest'] == null) {
            throw new runtime.RequiredError(
                'createJobRequest',
                'Required parameter "createJobRequest" was null or undefined when calling createJob().'
            );
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        if (requestParameters['idempotencyKey'] != null) {
            headerParameters['Idempotency-Key'] = String(requestParameters['idempotencyKey']);
        }

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("bearerApiKey", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }

        let urlPath = `/v1/jobs`;

        return {
            path: urlPath,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: CreateJobRequestToJSON(requestParameters['createJobRequest']),
        };
    }

    /**
     * Creates a queued encoding job from a completed upload source.  **Picking `profile`:** - Use `sophon-auto` unless you have a specific reason not to. It   picks per-source settings tuned for consistent output and   re-encodes at stricter settings if the first pass doesn\'t   hold up. - Use an explicit coffee profile (`sophon-espresso` / `-cortado` /   `-americano`) when you want deterministic encoder behavior —   same settings regardless of source. - Use an `-hq` variant when the source is a heavy format   (ProRes, DNxHD, high-bitrate camera originals). Larger output   files, maximum detail preservation. - Use an `-hq-10bit` variant when the source is 10-bit and you   want to preserve that depth end-to-end (ProRes 422/4444,   DNxHD, BRAW, camera masters).  See `JobProfile` for the full enum.  `output.target_height` requests an aspect-preserving downscale (width derived from source, both dims rounded to even). If absent or larger than source, output uses source dimensions. 
     * Submit an encoding job
     */
    async createJobRaw(requestParameters: CreateJobOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<JobResponse>> {
        const requestOptions = await this.createJobRequestOpts(requestParameters);
        const response = await this.request(requestOptions, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => JobResponseFromJSON(jsonValue));
    }

    /**
     * Creates a queued encoding job from a completed upload source.  **Picking `profile`:** - Use `sophon-auto` unless you have a specific reason not to. It   picks per-source settings tuned for consistent output and   re-encodes at stricter settings if the first pass doesn\'t   hold up. - Use an explicit coffee profile (`sophon-espresso` / `-cortado` /   `-americano`) when you want deterministic encoder behavior —   same settings regardless of source. - Use an `-hq` variant when the source is a heavy format   (ProRes, DNxHD, high-bitrate camera originals). Larger output   files, maximum detail preservation. - Use an `-hq-10bit` variant when the source is 10-bit and you   want to preserve that depth end-to-end (ProRes 422/4444,   DNxHD, BRAW, camera masters).  See `JobProfile` for the full enum.  `output.target_height` requests an aspect-preserving downscale (width derived from source, both dims rounded to even). If absent or larger than source, output uses source dimensions. 
     * Submit an encoding job
     */
    async createJob(requestParameters: CreateJobOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<JobResponse> {
        const response = await this.createJobRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Creates request options for getJob without sending the request
     */
    async getJobRequestOpts(requestParameters: GetJobRequest): Promise<runtime.RequestOpts> {
        if (requestParameters['id'] == null) {
            throw new runtime.RequiredError(
                'id',
                'Required parameter "id" was null or undefined when calling getJob().'
            );
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("bearerApiKey", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }

        let urlPath = `/v1/jobs/{id}`;
        urlPath = urlPath.replace(`{${"id"}}`, encodeURIComponent(String(requestParameters['id'])));

        return {
            path: urlPath,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        };
    }

    /**
     * Returns current job state, progress, source metadata, resolved adaptive profile information, and output availability for one job. 
     * Get a single job by ID
     */
    async getJobRaw(requestParameters: GetJobRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<JobResponse>> {
        const requestOptions = await this.getJobRequestOpts(requestParameters);
        const response = await this.request(requestOptions, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => JobResponseFromJSON(jsonValue));
    }

    /**
     * Returns current job state, progress, source metadata, resolved adaptive profile information, and output availability for one job. 
     * Get a single job by ID
     */
    async getJob(requestParameters: GetJobRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<JobResponse> {
        const response = await this.getJobRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Creates request options for getJobOutput without sending the request
     */
    async getJobOutputRequestOpts(requestParameters: GetJobOutputRequest): Promise<runtime.RequestOpts> {
        if (requestParameters['id'] == null) {
            throw new runtime.RequiredError(
                'id',
                'Required parameter "id" was null or undefined when calling getJobOutput().'
            );
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("bearerApiKey", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }

        let urlPath = `/v1/jobs/{id}/output`;
        urlPath = urlPath.replace(`{${"id"}}`, encodeURIComponent(String(requestParameters['id'])));

        return {
            path: urlPath,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        };
    }

    /**
     * Returns a 302 redirect to a signed download URL for the job\'s output file. The signed URL is valid for 24 hours. 
     * Get the encoded output file
     */
    async getJobOutputRaw(requestParameters: GetJobOutputRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        const requestOptions = await this.getJobOutputRequestOpts(requestParameters);
        const response = await this.request(requestOptions, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     * Returns a 302 redirect to a signed download URL for the job\'s output file. The signed URL is valid for 24 hours. 
     * Get the encoded output file
     */
    async getJobOutput(requestParameters: GetJobOutputRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.getJobOutputRaw(requestParameters, initOverrides);
    }

    /**
     * Creates request options for listJobs without sending the request
     */
    async listJobsRequestOpts(requestParameters: ListJobsRequest): Promise<runtime.RequestOpts> {
        const queryParameters: any = {};

        if (requestParameters['status'] != null) {
            queryParameters['status'] = requestParameters['status'];
        }

        if (requestParameters['limit'] != null) {
            queryParameters['limit'] = requestParameters['limit'];
        }

        if (requestParameters['cursor'] != null) {
            queryParameters['cursor'] = requestParameters['cursor'];
        }

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("bearerApiKey", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }

        let urlPath = `/v1/jobs`;

        return {
            path: urlPath,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        };
    }

    /**
     * Returns jobs for the authenticated organization ordered by creation time, with optional status filtering and opaque cursor pagination. 
     * List jobs with cursor pagination
     */
    async listJobsRaw(requestParameters: ListJobsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<ListJobsResponse>> {
        const requestOptions = await this.listJobsRequestOpts(requestParameters);
        const response = await this.request(requestOptions, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => ListJobsResponseFromJSON(jsonValue));
    }

    /**
     * Returns jobs for the authenticated organization ordered by creation time, with optional status filtering and opaque cursor pagination. 
     * List jobs with cursor pagination
     */
    async listJobs(requestParameters: ListJobsRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<ListJobsResponse> {
        const response = await this.listJobsRaw(requestParameters, initOverrides);
        return await response.value();
    }

}
