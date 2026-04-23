
# CreateUploadRequest


## Properties

Name | Type
------------ | -------------
`file_name` | string
`file_size` | number
`mime_type` | string

## Example

```typescript
import type { CreateUploadRequest } from '@liqhtworks/sophon-sdk'

// TODO: Update the object below with actual values
const example = {
  "file_name": null,
  "file_size": null,
  "mime_type": null,
} satisfies CreateUploadRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreateUploadRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


