
# ReadyResponse


## Properties

Name | Type
------------ | -------------
`ready` | boolean
`checks_failed` | Array&lt;string&gt;

## Example

```typescript
import type { ReadyResponse } from '@liqhtworks/sophon-sdk'

// TODO: Update the object below with actual values
const example = {
  "ready": null,
  "checks_failed": null,
} satisfies ReadyResponse

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ReadyResponse
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


