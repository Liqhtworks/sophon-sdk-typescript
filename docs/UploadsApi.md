# UploadsApi

All URIs are relative to *https://api.liqhtworks.xyz*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**cancelUpload**](UploadsApi.md#cancelupload) | **DELETE** /v1/uploads/{id} | Cancel an upload session |
| [**completeUpload**](UploadsApi.md#completeupload) | **POST** /v1/uploads/{id}/complete | Finalize a chunked upload |
| [**createUpload**](UploadsApi.md#createuploadoperation) | **POST** /v1/uploads | Initialize a chunked upload session |
| [**getUpload**](UploadsApi.md#getupload) | **GET** /v1/uploads/{id} | Get upload session status |
| [**uploadPart**](UploadsApi.md#uploadpart) | **PUT** /v1/uploads/{id}/parts/{part_number} | Upload a single chunk |



## cancelUpload

> cancelUpload(id)

Cancel an upload session

Sets the upload session to canceled and deletes staged chunks from disk. 

### Example

```ts
import {
  Configuration,
  UploadsApi,
} from '@liqhtworks/sophon-sdk';
import type { CancelUploadRequest } from '@liqhtworks/sophon-sdk';

async function example() {
  console.log("🚀 Testing @liqhtworks/sophon-sdk SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
    // Configure HTTP bearer authorization: bearerApiKey
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new UploadsApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies CancelUploadRequest;

  try {
    const data = await api.cancelUpload(body);
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
| **204** | Upload canceled. No content returned. |  * X-Request-Id -  <br>  |
| **401** | Missing or invalid credentials. |  * X-Request-Id -  <br>  |
| **403** | Insufficient scope (requires uploads:write). |  * X-Request-Id -  <br>  |
| **404** | Upload session not found. |  * X-Request-Id -  <br>  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## completeUpload

> CompleteUploadResponse completeUpload(id, idempotencyKey)

Finalize a chunked upload

Assembles all received chunks into a single file, validates size matches the declared file_size, probes with ffprobe, and transitions the session to completed. 

### Example

```ts
import {
  Configuration,
  UploadsApi,
} from '@liqhtworks/sophon-sdk';
import type { CompleteUploadRequest } from '@liqhtworks/sophon-sdk';

async function example() {
  console.log("🚀 Testing @liqhtworks/sophon-sdk SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
    // Configure HTTP bearer authorization: bearerApiKey
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new UploadsApi(config);

  const body = {
    // string
    id: id_example,
    // string | Client-generated UUID or string for exactly-once semantics. Required on all POST endpoints. Replaying the same key with the same request body returns the original response without side effects. 
    idempotencyKey: idempotencyKey_example,
  } satisfies CompleteUploadRequest;

  try {
    const data = await api.completeUpload(body);
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
| **idempotencyKey** | `string` | Client-generated UUID or string for exactly-once semantics. Required on all POST endpoints. Replaying the same key with the same request body returns the original response without side effects.  | [Defaults to `undefined`] |

### Return type

[**CompleteUploadResponse**](CompleteUploadResponse.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerApiKey](../README.md#bearerApiKey)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Upload assembled and validated. |  * X-Request-Id -  <br>  |
| **400** | Not all chunks received. |  * X-Request-Id -  <br>  |
| **401** | Missing or invalid credentials. |  * X-Request-Id -  <br>  |
| **403** | Insufficient scope (requires uploads:write). |  * X-Request-Id -  <br>  |
| **404** | Upload session not found. |  * X-Request-Id -  <br>  |
| **409** | Upload session is not in \&quot;uploading\&quot; state. |  * X-Request-Id -  <br>  |
| **422** | Assembled file size mismatch or not a valid video file (source_invalid). |  * X-Request-Id -  <br>  |
| **503** | Disk capacity exceeded; cannot assemble. |  * X-Request-Id -  <br>  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## createUpload

> CreateUploadResponse createUpload(idempotencyKey, createUploadRequest)

Initialize a chunked upload session

Starts a resumable source upload and returns the chunk size, chunk count, session ID, and expiration timestamp. 

### Example

```ts
import {
  Configuration,
  UploadsApi,
} from '@liqhtworks/sophon-sdk';
import type { CreateUploadOperationRequest } from '@liqhtworks/sophon-sdk';

async function example() {
  console.log("🚀 Testing @liqhtworks/sophon-sdk SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
    // Configure HTTP bearer authorization: bearerApiKey
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new UploadsApi(config);

  const body = {
    // string | Client-generated UUID or string for exactly-once semantics. Required on all POST endpoints. Replaying the same key with the same request body returns the original response without side effects. 
    idempotencyKey: idempotencyKey_example,
    // CreateUploadRequest
    createUploadRequest: ...,
  } satisfies CreateUploadOperationRequest;

  try {
    const data = await api.createUpload(body);
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
| **createUploadRequest** | [CreateUploadRequest](CreateUploadRequest.md) |  | |

### Return type

[**CreateUploadResponse**](CreateUploadResponse.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerApiKey](../README.md#bearerApiKey)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Upload session created. |  * X-Request-Id -  <br>  |
| **400** | Validation error (empty file_name, zero file_size, exceeds max). |  * X-Request-Id -  <br>  |
| **401** | Missing or invalid credentials. |  * X-Request-Id -  <br>  |
| **403** | Insufficient scope (requires uploads:create). |  * X-Request-Id -  <br>  |
| **409** | Idempotency conflict. |  * X-Request-Id -  <br>  |
| **429** | Rate limited or quota exceeded. |  * X-Request-Id -  <br>  |
| **503** | Disk capacity exceeded; uploads paused. |  * X-Request-Id -  <br>  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getUpload

> UploadStatusResponse getUpload(id)

Get upload session status

Returns received chunks and, after assembly/probe, source dimensions and duration used by downstream budget and encoding decisions. 

### Example

```ts
import {
  Configuration,
  UploadsApi,
} from '@liqhtworks/sophon-sdk';
import type { GetUploadRequest } from '@liqhtworks/sophon-sdk';

async function example() {
  console.log("🚀 Testing @liqhtworks/sophon-sdk SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
    // Configure HTTP bearer authorization: bearerApiKey
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new UploadsApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies GetUploadRequest;

  try {
    const data = await api.getUpload(body);
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

[**UploadStatusResponse**](UploadStatusResponse.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerApiKey](../README.md#bearerApiKey)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Upload session status. |  * X-Request-Id -  <br>  |
| **401** | Missing or invalid credentials. |  * X-Request-Id -  <br>  |
| **403** | Insufficient scope (requires uploads:read). |  * X-Request-Id -  <br>  |
| **404** | Upload session not found. |  * X-Request-Id -  <br>  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## uploadPart

> UploadPartResponse uploadPart(id, partNumber, body)

Upload a single chunk

Streams the chunk body to disk. Part numbers are 0-indexed. Uploading the same part number again is idempotent (returns success without re-writing). 

### Example

```ts
import {
  Configuration,
  UploadsApi,
} from '@liqhtworks/sophon-sdk';
import type { UploadPartRequest } from '@liqhtworks/sophon-sdk';

async function example() {
  console.log("🚀 Testing @liqhtworks/sophon-sdk SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
    // Configure HTTP bearer authorization: bearerApiKey
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new UploadsApi(config);

  const body = {
    // string
    id: id_example,
    // number
    partNumber: 56,
    // Blob
    body: BINARY_DATA_HERE,
  } satisfies UploadPartRequest;

  try {
    const data = await api.uploadPart(body);
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
| **partNumber** | `number` |  | [Defaults to `undefined`] |
| **body** | `Blob` |  | |

### Return type

[**UploadPartResponse**](UploadPartResponse.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerApiKey](../README.md#bearerApiKey)

### HTTP request headers

- **Content-Type**: `application/octet-stream`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Chunk received. |  * X-Request-Id -  <br>  |
| **400** | Part number out of range. |  * X-Request-Id -  <br>  |
| **401** | Missing or invalid credentials. |  * X-Request-Id -  <br>  |
| **403** | Insufficient scope (requires uploads:write). |  * X-Request-Id -  <br>  |
| **404** | Upload session not found. |  * X-Request-Id -  <br>  |
| **409** | Upload session is not in \&quot;uploading\&quot; state. |  * X-Request-Id -  <br>  |
| **503** | Disk capacity exceeded. |  * X-Request-Id -  <br>  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

