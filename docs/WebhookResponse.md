
# WebhookResponse


## Properties

Name | Type
------------ | -------------
`id` | string
`url` | string
`secret` | string
`active` | boolean
`created_at` | Date

## Example

```typescript
import type { WebhookResponse } from '@liqhtworks/sophon-sdk'

// TODO: Update the object below with actual values
const example = {
  "id": wh_abc123def456,
  "url": null,
  "secret": null,
  "active": null,
  "created_at": null,
} satisfies WebhookResponse

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WebhookResponse
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


