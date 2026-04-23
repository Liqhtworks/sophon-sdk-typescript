
# CompleteUploadResponse


## Properties

Name | Type
------------ | -------------
`id` | string
`status` | string
`sha256` | string
`bytes` | number

## Example

```typescript
import type { CompleteUploadResponse } from '@liqhtworks/sophon-sdk'

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "status": null,
  "sha256": null,
  "bytes": null,
} satisfies CompleteUploadResponse

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CompleteUploadResponse
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


