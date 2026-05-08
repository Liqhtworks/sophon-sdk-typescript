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
  CompleteUploadResponse,
  CreateUploadRequest,
  CreateUploadResponse,
  ErrorEnvelope,
  UploadPartResponse,
  UploadStatusResponse,
} from '../models/index';
import {
    CompleteUploadResponseFromJSON,
    CompleteUploadResponseToJSON,
    CreateUploadRequestFromJSON,
    CreateUploadRequestToJSON,
    CreateUploadResponseFromJSON,
    CreateUploadResponseToJSON,
    ErrorEnvelopeFromJSON,
    ErrorEnvelopeToJSON,
    UploadPartResponseFromJSON,
    UploadPartResponseToJSON,
    UploadStatusResponseFromJSON,
    UploadStatusResponseToJSON,
} from '../models/index';

export interface CancelUploadRequest {
    id: string;
}

export interface CompleteUploadRequest {
    id: string;
    idempotencyKey: string;
}

export interface CreateUploadOperationRequest {
    idempotencyKey: string;
    createUploadRequest: CreateUploadRequest;
}

export interface GetUploadRequest {
    id: string;
}

export interface UploadPartRequest {
    id: string;
    partNumber: number;
    body: Blob;
}

/**
 * UploadsApi - interface
 * 
 * @export
 * @interface UploadsApiInterface
 */
export interface UploadsApiInterface {
    /**
     * Creates request options for cancelUpload without sending the request
     * @param {string} id 
     * @throws {RequiredError}
     * @memberof UploadsApiInterface
     */
    cancelUploadRequestOpts(requestParameters: CancelUploadRequest): Promise<runtime.RequestOpts>;

    /**
     * Sets the upload session to canceled and deletes staged chunks from disk. 
     * @summary Cancel an upload session
     * @param {string} id 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof UploadsApiInterface
     */
    cancelUploadRaw(requestParameters: CancelUploadRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>>;

    /**
     * Sets the upload session to canceled and deletes staged chunks from disk. 
     * Cancel an upload session
     */
    cancelUpload(requestParameters: CancelUploadRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void>;

    /**
     * Creates request options for completeUpload without sending the request
     * @param {string} id 
     * @param {string} idempotencyKey Client-generated UUID or string for exactly-once semantics. Required on all POST endpoints. Replaying the same key with the same request body returns the original response without side effects. 
     * @throws {RequiredError}
     * @memberof UploadsApiInterface
     */
    completeUploadRequestOpts(requestParameters: CompleteUploadRequest): Promise<runtime.RequestOpts>;

    /**
     * Assembles all received chunks into a single file, validates size matches the declared file_size, probes with ffprobe, and transitions the session to completed. 
     * @summary Finalize a chunked upload
     * @param {string} id 
     * @param {string} idempotencyKey Client-generated UUID or string for exactly-once semantics. Required on all POST endpoints. Replaying the same key with the same request body returns the original response without side effects. 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof UploadsApiInterface
     */
    completeUploadRaw(requestParameters: CompleteUploadRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<CompleteUploadResponse>>;

    /**
     * Assembles all received chunks into a single file, validates size matches the declared file_size, probes with ffprobe, and transitions the session to completed. 
     * Finalize a chunked upload
     */
    completeUpload(requestParameters: CompleteUploadRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<CompleteUploadResponse>;

    /**
     * Creates request options for createUpload without sending the request
     * @param {string} idempotencyKey Client-generated UUID or string for exactly-once semantics. Required on all POST endpoints. Replaying the same key with the same request body returns the original response without side effects. 
     * @param {CreateUploadRequest} createUploadRequest 
     * @throws {RequiredError}
     * @memberof UploadsApiInterface
     */
    createUploadRequestOpts(requestParameters: CreateUploadOperationRequest): Promise<runtime.RequestOpts>;

    /**
     * Starts a resumable source upload and returns the chunk size, chunk count, session ID, and expiration timestamp. 
     * @summary Initialize a chunked upload session
     * @param {string} idempotencyKey Client-generated UUID or string for exactly-once semantics. Required on all POST endpoints. Replaying the same key with the same request body returns the original response without side effects. 
     * @param {CreateUploadRequest} createUploadRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof UploadsApiInterface
     */
    createUploadRaw(requestParameters: CreateUploadOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<CreateUploadResponse>>;

    /**
     * Starts a resumable source upload and returns the chunk size, chunk count, session ID, and expiration timestamp. 
     * Initialize a chunked upload session
     */
    createUpload(requestParameters: CreateUploadOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<CreateUploadResponse>;

    /**
     * Creates request options for getUpload without sending the request
     * @param {string} id 
     * @throws {RequiredError}
     * @memberof UploadsApiInterface
     */
    getUploadRequestOpts(requestParameters: GetUploadRequest): Promise<runtime.RequestOpts>;

    /**
     * Returns received chunks and, after assembly/probe, source dimensions and duration used by downstream budget and encoding decisions. 
     * @summary Get upload session status
     * @param {string} id 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof UploadsApiInterface
     */
    getUploadRaw(requestParameters: GetUploadRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<UploadStatusResponse>>;

    /**
     * Returns received chunks and, after assembly/probe, source dimensions and duration used by downstream budget and encoding decisions. 
     * Get upload session status
     */
    getUpload(requestParameters: GetUploadRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<UploadStatusResponse>;

    /**
     * Creates request options for uploadPart without sending the request
     * @param {string} id 
     * @param {number} partNumber 
     * @param {Blob} body 
     * @throws {RequiredError}
     * @memberof UploadsApiInterface
     */
    uploadPartRequestOpts(requestParameters: UploadPartRequest): Promise<runtime.RequestOpts>;

    /**
     * Streams the chunk body to disk. Part numbers are 0-indexed. Uploading the same part number again is idempotent (returns success without re-writing). 
     * @summary Upload a single chunk
     * @param {string} id 
     * @param {number} partNumber 
     * @param {Blob} body 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof UploadsApiInterface
     */
    uploadPartRaw(requestParameters: UploadPartRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<UploadPartResponse>>;

    /**
     * Streams the chunk body to disk. Part numbers are 0-indexed. Uploading the same part number again is idempotent (returns success without re-writing). 
     * Upload a single chunk
     */
    uploadPart(requestParameters: UploadPartRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<UploadPartResponse>;

}

/**
 * 
 */
export class UploadsApi extends runtime.BaseAPI implements UploadsApiInterface {

    /**
     * Creates request options for cancelUpload without sending the request
     */
    async cancelUploadRequestOpts(requestParameters: CancelUploadRequest): Promise<runtime.RequestOpts> {
        if (requestParameters['id'] == null) {
            throw new runtime.RequiredError(
                'id',
                'Required parameter "id" was null or undefined when calling cancelUpload().'
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

        let urlPath = `/v1/uploads/{id}`;
        urlPath = urlPath.replace(`{${"id"}}`, encodeURIComponent(String(requestParameters['id'])));

        return {
            path: urlPath,
            method: 'DELETE',
            headers: headerParameters,
            query: queryParameters,
        };
    }

    /**
     * Sets the upload session to canceled and deletes staged chunks from disk. 
     * Cancel an upload session
     */
    async cancelUploadRaw(requestParameters: CancelUploadRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        const requestOptions = await this.cancelUploadRequestOpts(requestParameters);
        const response = await this.request(requestOptions, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     * Sets the upload session to canceled and deletes staged chunks from disk. 
     * Cancel an upload session
     */
    async cancelUpload(requestParameters: CancelUploadRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.cancelUploadRaw(requestParameters, initOverrides);
    }

    /**
     * Creates request options for completeUpload without sending the request
     */
    async completeUploadRequestOpts(requestParameters: CompleteUploadRequest): Promise<runtime.RequestOpts> {
        if (requestParameters['id'] == null) {
            throw new runtime.RequiredError(
                'id',
                'Required parameter "id" was null or undefined when calling completeUpload().'
            );
        }

        if (requestParameters['idempotencyKey'] == null) {
            throw new runtime.RequiredError(
                'idempotencyKey',
                'Required parameter "idempotencyKey" was null or undefined when calling completeUpload().'
            );
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

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

        let urlPath = `/v1/uploads/{id}/complete`;
        urlPath = urlPath.replace(`{${"id"}}`, encodeURIComponent(String(requestParameters['id'])));

        return {
            path: urlPath,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
        };
    }

    /**
     * Assembles all received chunks into a single file, validates size matches the declared file_size, probes with ffprobe, and transitions the session to completed. 
     * Finalize a chunked upload
     */
    async completeUploadRaw(requestParameters: CompleteUploadRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<CompleteUploadResponse>> {
        const requestOptions = await this.completeUploadRequestOpts(requestParameters);
        const response = await this.request(requestOptions, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => CompleteUploadResponseFromJSON(jsonValue));
    }

    /**
     * Assembles all received chunks into a single file, validates size matches the declared file_size, probes with ffprobe, and transitions the session to completed. 
     * Finalize a chunked upload
     */
    async completeUpload(requestParameters: CompleteUploadRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<CompleteUploadResponse> {
        const response = await this.completeUploadRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Creates request options for createUpload without sending the request
     */
    async createUploadRequestOpts(requestParameters: CreateUploadOperationRequest): Promise<runtime.RequestOpts> {
        if (requestParameters['idempotencyKey'] == null) {
            throw new runtime.RequiredError(
                'idempotencyKey',
                'Required parameter "idempotencyKey" was null or undefined when calling createUpload().'
            );
        }

        if (requestParameters['createUploadRequest'] == null) {
            throw new runtime.RequiredError(
                'createUploadRequest',
                'Required parameter "createUploadRequest" was null or undefined when calling createUpload().'
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

        let urlPath = `/v1/uploads`;

        return {
            path: urlPath,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: CreateUploadRequestToJSON(requestParameters['createUploadRequest']),
        };
    }

    /**
     * Starts a resumable source upload and returns the chunk size, chunk count, session ID, and expiration timestamp. 
     * Initialize a chunked upload session
     */
    async createUploadRaw(requestParameters: CreateUploadOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<CreateUploadResponse>> {
        const requestOptions = await this.createUploadRequestOpts(requestParameters);
        const response = await this.request(requestOptions, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => CreateUploadResponseFromJSON(jsonValue));
    }

    /**
     * Starts a resumable source upload and returns the chunk size, chunk count, session ID, and expiration timestamp. 
     * Initialize a chunked upload session
     */
    async createUpload(requestParameters: CreateUploadOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<CreateUploadResponse> {
        const response = await this.createUploadRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Creates request options for getUpload without sending the request
     */
    async getUploadRequestOpts(requestParameters: GetUploadRequest): Promise<runtime.RequestOpts> {
        if (requestParameters['id'] == null) {
            throw new runtime.RequiredError(
                'id',
                'Required parameter "id" was null or undefined when calling getUpload().'
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

        let urlPath = `/v1/uploads/{id}`;
        urlPath = urlPath.replace(`{${"id"}}`, encodeURIComponent(String(requestParameters['id'])));

        return {
            path: urlPath,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        };
    }

    /**
     * Returns received chunks and, after assembly/probe, source dimensions and duration used by downstream budget and encoding decisions. 
     * Get upload session status
     */
    async getUploadRaw(requestParameters: GetUploadRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<UploadStatusResponse>> {
        const requestOptions = await this.getUploadRequestOpts(requestParameters);
        const response = await this.request(requestOptions, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => UploadStatusResponseFromJSON(jsonValue));
    }

    /**
     * Returns received chunks and, after assembly/probe, source dimensions and duration used by downstream budget and encoding decisions. 
     * Get upload session status
     */
    async getUpload(requestParameters: GetUploadRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<UploadStatusResponse> {
        const response = await this.getUploadRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Creates request options for uploadPart without sending the request
     */
    async uploadPartRequestOpts(requestParameters: UploadPartRequest): Promise<runtime.RequestOpts> {
        if (requestParameters['id'] == null) {
            throw new runtime.RequiredError(
                'id',
                'Required parameter "id" was null or undefined when calling uploadPart().'
            );
        }

        if (requestParameters['partNumber'] == null) {
            throw new runtime.RequiredError(
                'partNumber',
                'Required parameter "partNumber" was null or undefined when calling uploadPart().'
            );
        }

        if (requestParameters['body'] == null) {
            throw new runtime.RequiredError(
                'body',
                'Required parameter "body" was null or undefined when calling uploadPart().'
            );
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/octet-stream';

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("bearerApiKey", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }

        let urlPath = `/v1/uploads/{id}/parts/{part_number}`;
        urlPath = urlPath.replace(`{${"id"}}`, encodeURIComponent(String(requestParameters['id'])));
        urlPath = urlPath.replace(`{${"part_number"}}`, encodeURIComponent(String(requestParameters['partNumber'])));

        return {
            path: urlPath,
            method: 'PUT',
            headers: headerParameters,
            query: queryParameters,
            body: requestParameters['body'] as any,
        };
    }

    /**
     * Streams the chunk body to disk. Part numbers are 0-indexed. Uploading the same part number again is idempotent (returns success without re-writing). 
     * Upload a single chunk
     */
    async uploadPartRaw(requestParameters: UploadPartRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<UploadPartResponse>> {
        const requestOptions = await this.uploadPartRequestOpts(requestParameters);
        const response = await this.request(requestOptions, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => UploadPartResponseFromJSON(jsonValue));
    }

    /**
     * Streams the chunk body to disk. Part numbers are 0-indexed. Uploading the same part number again is idempotent (returns success without re-writing). 
     * Upload a single chunk
     */
    async uploadPart(requestParameters: UploadPartRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<UploadPartResponse> {
        const response = await this.uploadPartRaw(requestParameters, initOverrides);
        return await response.value();
    }

}
