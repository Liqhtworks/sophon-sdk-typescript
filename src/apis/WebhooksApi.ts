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
  CreateWebhookRequest,
  ErrorEnvelope,
  WebhookListResponse,
  WebhookResponse,
} from '../models/index';
import {
    CreateWebhookRequestFromJSON,
    CreateWebhookRequestToJSON,
    ErrorEnvelopeFromJSON,
    ErrorEnvelopeToJSON,
    WebhookListResponseFromJSON,
    WebhookListResponseToJSON,
    WebhookResponseFromJSON,
    WebhookResponseToJSON,
} from '../models/index';

export interface CreateWebhookOperationRequest {
    idempotencyKey: string;
    createWebhookRequest: CreateWebhookRequest;
}

export interface DeleteWebhookRequest {
    id: string;
}

/**
 * WebhooksApi - interface
 * 
 * @export
 * @interface WebhooksApiInterface
 */
export interface WebhooksApiInterface {
    /**
     * Creates request options for createWebhook without sending the request
     * @param {string} idempotencyKey Client-generated UUID or string for exactly-once semantics. Required on all POST endpoints. Replaying the same key with the same request body returns the original response without side effects. 
     * @param {CreateWebhookRequest} createWebhookRequest 
     * @throws {RequiredError}
     * @memberof WebhooksApiInterface
     */
    createWebhookRequestOpts(requestParameters: CreateWebhookOperationRequest): Promise<runtime.RequestOpts>;

    /**
     * Registers an HTTPS endpoint for terminal job events and returns the HMAC signing secret once at creation time. 
     * @summary Register a webhook endpoint
     * @param {string} idempotencyKey Client-generated UUID or string for exactly-once semantics. Required on all POST endpoints. Replaying the same key with the same request body returns the original response without side effects. 
     * @param {CreateWebhookRequest} createWebhookRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof WebhooksApiInterface
     */
    createWebhookRaw(requestParameters: CreateWebhookOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<WebhookResponse>>;

    /**
     * Registers an HTTPS endpoint for terminal job events and returns the HMAC signing secret once at creation time. 
     * Register a webhook endpoint
     */
    createWebhook(requestParameters: CreateWebhookOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<WebhookResponse>;

    /**
     * Creates request options for deleteWebhook without sending the request
     * @param {string} id 
     * @throws {RequiredError}
     * @memberof WebhooksApiInterface
     */
    deleteWebhookRequestOpts(requestParameters: DeleteWebhookRequest): Promise<runtime.RequestOpts>;

    /**
     * Sets the webhook to inactive. It will no longer receive deliveries.
     * @summary Soft-delete a webhook endpoint
     * @param {string} id 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof WebhooksApiInterface
     */
    deleteWebhookRaw(requestParameters: DeleteWebhookRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>>;

    /**
     * Sets the webhook to inactive. It will no longer receive deliveries.
     * Soft-delete a webhook endpoint
     */
    deleteWebhook(requestParameters: DeleteWebhookRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void>;

    /**
     * Creates request options for listWebhooks without sending the request
     * @throws {RequiredError}
     * @memberof WebhooksApiInterface
     */
    listWebhooksRequestOpts(): Promise<runtime.RequestOpts>;

    /**
     * Lists active webhook endpoints for the authenticated organization. 
     * @summary List active webhook endpoints
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof WebhooksApiInterface
     */
    listWebhooksRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<WebhookListResponse>>;

    /**
     * Lists active webhook endpoints for the authenticated organization. 
     * List active webhook endpoints
     */
    listWebhooks(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<WebhookListResponse>;

}

/**
 * 
 */
export class WebhooksApi extends runtime.BaseAPI implements WebhooksApiInterface {

    /**
     * Creates request options for createWebhook without sending the request
     */
    async createWebhookRequestOpts(requestParameters: CreateWebhookOperationRequest): Promise<runtime.RequestOpts> {
        if (requestParameters['idempotencyKey'] == null) {
            throw new runtime.RequiredError(
                'idempotencyKey',
                'Required parameter "idempotencyKey" was null or undefined when calling createWebhook().'
            );
        }

        if (requestParameters['createWebhookRequest'] == null) {
            throw new runtime.RequiredError(
                'createWebhookRequest',
                'Required parameter "createWebhookRequest" was null or undefined when calling createWebhook().'
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

        let urlPath = `/v1/webhooks`;

        return {
            path: urlPath,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: CreateWebhookRequestToJSON(requestParameters['createWebhookRequest']),
        };
    }

    /**
     * Registers an HTTPS endpoint for terminal job events and returns the HMAC signing secret once at creation time. 
     * Register a webhook endpoint
     */
    async createWebhookRaw(requestParameters: CreateWebhookOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<WebhookResponse>> {
        const requestOptions = await this.createWebhookRequestOpts(requestParameters);
        const response = await this.request(requestOptions, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => WebhookResponseFromJSON(jsonValue));
    }

    /**
     * Registers an HTTPS endpoint for terminal job events and returns the HMAC signing secret once at creation time. 
     * Register a webhook endpoint
     */
    async createWebhook(requestParameters: CreateWebhookOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<WebhookResponse> {
        const response = await this.createWebhookRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Creates request options for deleteWebhook without sending the request
     */
    async deleteWebhookRequestOpts(requestParameters: DeleteWebhookRequest): Promise<runtime.RequestOpts> {
        if (requestParameters['id'] == null) {
            throw new runtime.RequiredError(
                'id',
                'Required parameter "id" was null or undefined when calling deleteWebhook().'
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

        let urlPath = `/v1/webhooks/{id}`;
        urlPath = urlPath.replace(`{${"id"}}`, encodeURIComponent(String(requestParameters['id'])));

        return {
            path: urlPath,
            method: 'DELETE',
            headers: headerParameters,
            query: queryParameters,
        };
    }

    /**
     * Sets the webhook to inactive. It will no longer receive deliveries.
     * Soft-delete a webhook endpoint
     */
    async deleteWebhookRaw(requestParameters: DeleteWebhookRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        const requestOptions = await this.deleteWebhookRequestOpts(requestParameters);
        const response = await this.request(requestOptions, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     * Sets the webhook to inactive. It will no longer receive deliveries.
     * Soft-delete a webhook endpoint
     */
    async deleteWebhook(requestParameters: DeleteWebhookRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.deleteWebhookRaw(requestParameters, initOverrides);
    }

    /**
     * Creates request options for listWebhooks without sending the request
     */
    async listWebhooksRequestOpts(): Promise<runtime.RequestOpts> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("bearerApiKey", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }

        let urlPath = `/v1/webhooks`;

        return {
            path: urlPath,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        };
    }

    /**
     * Lists active webhook endpoints for the authenticated organization. 
     * List active webhook endpoints
     */
    async listWebhooksRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<WebhookListResponse>> {
        const requestOptions = await this.listWebhooksRequestOpts();
        const response = await this.request(requestOptions, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => WebhookListResponseFromJSON(jsonValue));
    }

    /**
     * Lists active webhook endpoints for the authenticated organization. 
     * List active webhook endpoints
     */
    async listWebhooks(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<WebhookListResponse> {
        const response = await this.listWebhooksRaw(initOverrides);
        return await response.value();
    }

}
