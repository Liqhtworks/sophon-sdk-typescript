# JobsApi

All URIs are relative to *https://api.liqhtworks.xyz*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**cancelJob**](JobsApi.md#canceljob) | **DELETE** /v1/jobs/{id} | Cancel a job |
| [**createJob**](JobsApi.md#createjoboperation) | **POST** /v1/jobs | Submit an encoding job |
| [**getJob**](JobsApi.md#getjob) | **GET** /v1/jobs/{id} | Get a single job by ID |
| [**getJobOutput**](JobsApi.md#getjoboutput) | **GET** /v1/jobs/{id}/output | Get the encoded output file |
| [**listJobs**](JobsApi.md#listjobs) | **GET** /v1/jobs | List jobs with cursor pagination |



## cancelJob

> JobResponse cancelJob(id)

Cancel a job

Cancels a job in a non-terminal state (queued, probing, encoding, muxing, uploading_output). Returns 409 if the job is already completed, failed, or canceled. 

### Example

```ts
import {
  Configuration,
  JobsApi,
} from '@liqhtworks/sophon-sdk';
import type { CancelJobRequest } from '@liqhtworks/sophon-sdk';

async function example() {
  console.log("🚀 Testing @liqhtworks/sophon-sdk SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
    // Configure HTTP bearer authorization: bearerApiKey
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new JobsApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies CancelJobRequest;

  try {
    const data = await api.cancelJob(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

[**JobResponse**](JobResponse.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerApiKey](../README.md#bearerApiKey)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Job canceled. Returns the updated job. |  * X-Request-Id -  <br>  |
| **401** | Missing or invalid credentials. |  * X-Request-Id -  <br>  |
| **403** | Insufficient scope (requires jobs:cancel). |  * X-Request-Id -  <br>  |
| **404** | Job not found. |  * X-Request-Id -  <br>  |
| **409** | Job is in a terminal state and cannot be canceled (job_not_cancelable). |  * X-Request-Id -  <br>  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## createJob

> JobResponse createJob(idempotencyKey, createJobRequest)

Submit an encoding job

Creates a queued encoding job from a completed upload source. The &#x60;profile&#x60; field accepts explicit coffee profiles or &#x60;sophon-auto&#x60;, and &#x60;output.target_height&#x60; can request aspect-preserving downscale. 

### Example

```ts
import {
  Configuration,
  JobsApi,
} from '@liqhtworks/sophon-sdk';
import type { CreateJobOperationRequest } from '@liqhtworks/sophon-sdk';

async function example() {
  console.log("🚀 Testing @liqhtworks/sophon-sdk SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
    // Configure HTTP bearer authorization: bearerApiKey
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new JobsApi(config);

  const body = {
    // string | Client-generated UUID or string for exactly-once semantics. Required on all POST endpoints. Replaying the same key with the same request body returns the original response without side effects. 
    idempotencyKey: idempotencyKey_example,
    // CreateJobRequest
    createJobRequest: ...,
  } satisfies CreateJobOperationRequest;

  try {
    const data = await api.createJob(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **idempotencyKey** | `string` | Client-generated UUID or string for exactly-once semantics. Required on all POST endpoints. Replaying the same key with the same request body returns the original response without side effects.  | [Defaults to `undefined`] |
| **createJobRequest** | [CreateJobRequest](CreateJobRequest.md) |  | |

### Return type

[**JobResponse**](JobResponse.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerApiKey](../README.md#bearerApiKey)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Job created. |  * X-Request-Id -  <br>  |
| **400** | Validation error (bad profile, source, container, metadata, or webhook_ids). |  * X-Request-Id -  <br>  |
| **401** | Missing or invalid credentials. |  * X-Request-Id -  <br>  |
| **403** | Insufficient scope (requires jobs:create). |  * X-Request-Id -  <br>  |
| **409** | Idempotency conflict (same key, different request body). |  * X-Request-Id -  <br>  |
| **422** | Source is invalid or unsupported. |  * X-Request-Id -  <br>  |
| **429** | Rate limited or quota exceeded. |  * X-Request-Id -  <br>  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getJob

> JobResponse getJob(id)

Get a single job by ID

Returns current job state, progress, source metadata, resolved adaptive profile information, and output availability for one job. 

### Example

```ts
import {
  Configuration,
  JobsApi,
} from '@liqhtworks/sophon-sdk';
import type { GetJobRequest } from '@liqhtworks/sophon-sdk';

async function example() {
  console.log("🚀 Testing @liqhtworks/sophon-sdk SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
    // Configure HTTP bearer authorization: bearerApiKey
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new JobsApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies GetJobRequest;

  try {
    const data = await api.getJob(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

[**JobResponse**](JobResponse.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerApiKey](../README.md#bearerApiKey)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Job details. |  * X-Request-Id -  <br>  |
| **401** | Missing or invalid credentials. |  * X-Request-Id -  <br>  |
| **403** | Insufficient scope (requires jobs:read). |  * X-Request-Id -  <br>  |
| **404** | Job not found. |  * X-Request-Id -  <br>  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getJobOutput

> getJobOutput(id)

Get the encoded output file

Returns a 302 redirect to a signed download URL for the job\&#39;s output file. The signed URL is valid for 24 hours. 

### Example

```ts
import {
  Configuration,
  JobsApi,
} from '@liqhtworks/sophon-sdk';
import type { GetJobOutputRequest } from '@liqhtworks/sophon-sdk';

async function example() {
  console.log("🚀 Testing @liqhtworks/sophon-sdk SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
    // Configure HTTP bearer authorization: bearerApiKey
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new JobsApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies GetJobOutputRequest;

  try {
    const data = await api.getJobOutput(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerApiKey](../README.md#bearerApiKey)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **302** | Redirect to signed download URL. The resolved resource is a video/mp4 file.  |  * Location - Signed download URL (24-hour TTL). Resolves to video/mp4. <br>  * X-Request-Id -  <br>  |
| **401** | Missing or invalid credentials. |  * X-Request-Id -  <br>  |
| **403** | Insufficient scope (requires outputs:read). |  * X-Request-Id -  <br>  |
| **404** | Job not found. |  * X-Request-Id -  <br>  |
| **409** | Output not ready (job not in completed state). |  * X-Request-Id -  <br>  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listJobs

> ListJobsResponse listJobs(status, limit, cursor)

List jobs with cursor pagination

Returns jobs for the authenticated organization ordered by creation time, with optional status filtering and opaque cursor pagination. 

### Example

```ts
import {
  Configuration,
  JobsApi,
} from '@liqhtworks/sophon-sdk';
import type { ListJobsRequest } from '@liqhtworks/sophon-sdk';

async function example() {
  console.log("🚀 Testing @liqhtworks/sophon-sdk SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
    // Configure HTTP bearer authorization: bearerApiKey
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new JobsApi(config);

  const body = {
    // JobStatus | Filter by job status. (optional)
    status: ...,
    // number | Maximum number of items to return per page. (optional)
    limit: 56,
    // string | Opaque pagination cursor returned in a previous response\'s `next_cursor` field. (optional)
    cursor: cursor_example,
  } satisfies ListJobsRequest;

  try {
    const data = await api.listJobs(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **status** | `JobStatus` | Filter by job status. | [Optional] [Defaults to `undefined`] [Enum: queued, probing, encoding, muxing, uploading_output, completed, failed, canceled] |
| **limit** | `number` | Maximum number of items to return per page. | [Optional] [Defaults to `20`] |
| **cursor** | `string` | Opaque pagination cursor returned in a previous response\&#39;s &#x60;next_cursor&#x60; field. | [Optional] [Defaults to `undefined`] |

### Return type

[**ListJobsResponse**](ListJobsResponse.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerApiKey](../README.md#bearerApiKey)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Paginated list of jobs, ordered by created_at descending. |  * X-Request-Id -  <br>  |
| **400** | Invalid status filter or cursor. |  * X-Request-Id -  <br>  |
| **401** | Missing or invalid credentials. |  * X-Request-Id -  <br>  |
| **403** | Insufficient scope (requires jobs:read). |  * X-Request-Id -  <br>  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

