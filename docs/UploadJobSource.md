
# UploadJobSource

Source backed by a completed chunked upload session.

## Properties

Name | Type
------------ | -------------
`type` | [JobSourceType](JobSourceType.md)
`upload_id` | string

## Example

```typescript
import type { UploadJobSource } from '@liqhtworks/sophon-sdk'

// TODO: Update the object below with actual values
const example = {
  "type": null,
  "upload_id": upl_01JQ8abc123,
} satisfies UploadJobSource

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UploadJobSource
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


