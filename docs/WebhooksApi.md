# WebhooksApi

All URIs are relative to *https://api.liqhtworks.xyz*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**createWebhook**](WebhooksApi.md#createwebhookoperation) | **POST** /v1/webhooks | Register a webhook endpoint |
| [**deleteWebhook**](WebhooksApi.md#deletewebhook) | **DELETE** /v1/webhooks/{id} | Soft-delete a webhook endpoint |
| [**listWebhooks**](WebhooksApi.md#listwebhooks) | **GET** /v1/webhooks | List active webhook endpoints |



## createWebhook

> WebhookResponse createWebhook(idempotencyKey, createWebhookRequest)

Register a webhook endpoint

Registers an HTTPS endpoint for terminal job events and returns the HMAC signing secret once at creation time. 

### Example

```ts
import {
  Configuration,
  WebhooksApi,
} from '@liqhtworks/sophon-sdk';
import type { CreateWebhookOperationRequest } from '@liqhtworks/sophon-sdk';

async function example() {
  console.log("🚀 Testing @liqhtworks/sophon-sdk SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
    // Configure HTTP bearer authorization: bearerApiKey
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WebhooksApi(config);

  const body = {
    // string | Client-generated UUID or string for exactly-once semantics. Required on all POST endpoints. Replaying the same key with the same request body returns the original response without side effects. 
    idempotencyKey: idempotencyKey_example,
    // CreateWebhookRequest
    createWebhookRequest: ...,
  } satisfies CreateWebhookOperationRequest;

  try {
    const data = await api.createWebhook(body);
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
| **createWebhookRequest** | [CreateWebhookRequest](CreateWebhookRequest.md) |  | |

### Return type

[**WebhookResponse**](WebhookResponse.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerApiKey](../README.md#bearerApiKey)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Webhook registered. The response includes the HMAC secret (shown only once). |  * X-Request-Id -  <br>  |
| **400** | Invalid URL (non-HTTPS, private IP, userinfo, etc.). |  * X-Request-Id -  <br>  |
| **401** | Missing or invalid credentials. |  * X-Request-Id -  <br>  |
| **403** | Insufficient scope (requires webhooks:manage). |  * X-Request-Id -  <br>  |
| **409** | Idempotency conflict. |  * X-Request-Id -  <br>  |
| **429** | Rate limited. |  * X-Request-Id -  <br>  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## deleteWebhook

> deleteWebhook(id)

Soft-delete a webhook endpoint

Sets the webhook to inactive. It will no longer receive deliveries.

### Example

```ts
import {
  Configuration,
  WebhooksApi,
} from '@liqhtworks/sophon-sdk';
import type { DeleteWebhookRequest } from '@liqhtworks/sophon-sdk';

async function example() {
  console.log("🚀 Testing @liqhtworks/sophon-sdk SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
    // Configure HTTP bearer authorization: bearerApiKey
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WebhooksApi(config);

  const body = {
    // string
    id: id_example,
  } satisfies DeleteWebhookRequest;

  try {
    const data = await api.deleteWebhook(body);
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
| **204** | Webhook deactivated. No content returned. |  * X-Request-Id -  <br>  |
| **401** | Missing or invalid credentials. |  * X-Request-Id -  <br>  |
| **403** | Insufficient scope (requires webhooks:manage). |  * X-Request-Id -  <br>  |
| **404** | Webhook not found or already inactive. |  * X-Request-Id -  <br>  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listWebhooks

> WebhookListResponse listWebhooks()

List active webhook endpoints

Lists active webhook endpoints for the authenticated organization. 

### Example

```ts
import {
  Configuration,
  WebhooksApi,
} from '@liqhtworks/sophon-sdk';
import type { ListWebhooksRequest } from '@liqhtworks/sophon-sdk';

async function example() {
  console.log("🚀 Testing @liqhtworks/sophon-sdk SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
    // Configure HTTP bearer authorization: bearerApiKey
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WebhooksApi(config);

  try {
    const data = await api.listWebhooks();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**WebhookListResponse**](WebhookListResponse.md)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerApiKey](../README.md#bearerApiKey)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of active webhooks for the authenticated organization. |  * X-Request-Id -  <br>  |
| **401** | Missing or invalid credentials. |  * X-Request-Id -  <br>  |
| **403** | Insufficient scope (requires webhooks:manage). |  * X-Request-Id -  <br>  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

