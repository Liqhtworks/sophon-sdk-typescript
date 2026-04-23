
# WebhookDeliveryPayload

Payload delivered to registered webhook endpoints on terminal job events. Signed with HMAC-SHA256 over `\"{timestamp}.{raw_body}\"` using the per-webhook secret. Consumers must verify the signature before processing. 

## Properties

Name | Type
------------ | -------------
`event_id` | string
`type` | string
`timestamp` | Date
`job_id` | string
`status` | string
`metadata` | { [key: string]: any; }

## Example

```typescript
import type { WebhookDeliveryPayload } from '@liqhtworks/sophon-sdk'

// TODO: Update the object below with actual values
const example = {
  "event_id": evt_01JQabc123,
  "type": null,
  "timestamp": null,
  "job_id": job_01JQ8C4K4W6YQ7M4M0A5K9T6RF,
  "status": null,
  "metadata": null,
} satisfies WebhookDeliveryPayload

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WebhookDeliveryPayload
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


