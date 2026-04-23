
# UploadStatusResponse


## Properties

Name | Type
------------ | -------------
`id` | string
`status` | string
`file_name` | string
`total_chunks` | number
`received_chunks` | Array&lt;number&gt;
`expires_at` | Date
`source_width` | number
`source_height` | number
`source_duration_seconds` | number

## Example

```typescript
import type { UploadStatusResponse } from '@liqhtworks/sophon-sdk'

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "status": null,
  "file_name": null,
  "total_chunks": null,
  "received_chunks": null,
  "expires_at": null,
  "source_width": 3840,
  "source_height": 2160,
  "source_duration_seconds": 600.0,
} satisfies UploadStatusResponse

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UploadStatusResponse
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


