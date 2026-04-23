
# CreateUploadResponse


## Properties

Name | Type
------------ | -------------
`id` | string
`chunk_size` | number
`total_chunks` | number
`expires_at` | Date

## Example

```typescript
import type { CreateUploadResponse } from '@liqhtworks/sophon-sdk'

// TODO: Update the object below with actual values
const example = {
  "id": upl_abc123def456,
  "chunk_size": null,
  "total_chunks": null,
  "expires_at": null,
} satisfies CreateUploadResponse

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreateUploadResponse
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


