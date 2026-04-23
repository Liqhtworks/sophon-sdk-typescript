# WebhookEventsApi

All URIs are relative to *https://api.liqhtworks.xyz*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**receiveJobTerminalWebhook**](WebhookEventsApi.md#receivejobterminalwebhook) | **POST** /jobTerminalEvent | Receive a terminal job webhook |



## receiveJobTerminalWebhook

> receiveJobTerminalWebhook(xTurboSignature256, xTurboEventId, xTurboTimestamp, webhookDeliveryPayload)

Receive a terminal job webhook

Outbound webhook delivery sent to registered webhook endpoints when a job reaches &#x60;completed&#x60;, &#x60;failed&#x60;, or &#x60;canceled&#x60;. Consumers should verify &#x60;X-Turbo-Signature-256&#x60; before processing. 

### Example

```ts
import {
  Configuration,
  WebhookEventsApi,
} from '@liqhtworks/sophon-sdk';
import type { ReceiveJobTerminalWebhookRequest } from '@liqhtworks/sophon-sdk';

async function example() {
  console.log("🚀 Testing @liqhtworks/sophon-sdk SDK...");
  const config = new Configuration({ 
    // To configure API key authorization: sessionCookie
    apiKey: "YOUR API KEY",
    // Configure HTTP bearer authorization: bearerApiKey
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new WebhookEventsApi(config);

  const body = {
    // string | `sha256={hex}` — HMAC-SHA256 of `\"{X-Turbo-Timestamp}.{raw_body}\"` using the webhook\'s secret key. 
    xTurboSignature256: sha256=abc123def456...,
    // string | Unique event ID for consumer deduplication.
    xTurboEventId: evt_01JQabc123,
    // Date | Timestamp used in signature computation. Check for replay.
    xTurboTimestamp: 2013-10-20T19:20:30+01:00,
    // WebhookDeliveryPayload
    webhookDeliveryPayload: ...,
  } satisfies ReceiveJobTerminalWebhookRequest;

  try {
    const data = await api.receiveJobTerminalWebhook(body);
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
| **xTurboSignature256** | `string` | &#x60;sha256&#x3D;{hex}&#x60; — HMAC-SHA256 of &#x60;\&quot;{X-Turbo-Timestamp}.{raw_body}\&quot;&#x60; using the webhook\&#39;s secret key.  | [Defaults to `undefined`] |
| **xTurboEventId** | `string` | Unique event ID for consumer deduplication. | [Defaults to `undefined`] |
| **xTurboTimestamp** | `Date` | Timestamp used in signature computation. Check for replay. | [Defaults to `undefined`] |
| **webhookDeliveryPayload** | [WebhookDeliveryPayload](WebhookDeliveryPayload.md) |  | |

### Return type

`void` (Empty response body)

### Authorization

[sessionCookie](../README.md#sessionCookie), [bearerApiKey](../README.md#bearerApiKey)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Webhook accepted by the consumer. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

