
# WebhookListItem


## Properties

Name | Type
------------ | -------------
`id` | string
`url` | string
`active` | boolean
`created_at` | Date

## Example

```typescript
import type { WebhookListItem } from '@liqhtworks/sophon-sdk'

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "url": null,
  "active": null,
  "created_at": null,
} satisfies WebhookListItem

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WebhookListItem
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


