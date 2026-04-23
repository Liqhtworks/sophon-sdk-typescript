
# ListJobsResponse


## Properties

Name | Type
------------ | -------------
`jobs` | [Array&lt;JobResponse&gt;](JobResponse.md)
`next_cursor` | string
`has_more` | boolean

## Example

```typescript
import type { ListJobsResponse } from '@liqhtworks/sophon-sdk'

// TODO: Update the object below with actual values
const example = {
  "jobs": null,
  "next_cursor": null,
  "has_more": null,
} satisfies ListJobsResponse

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ListJobsResponse
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


