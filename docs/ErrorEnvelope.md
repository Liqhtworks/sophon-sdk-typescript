
# ErrorEnvelope


## Properties

Name | Type
------------ | -------------
`error` | [ErrorBody](ErrorBody.md)

## Example

```typescript
import type { ErrorEnvelope } from '@liqhtworks/sophon-sdk'

// TODO: Update the object below with actual values
const example = {
  "error": null,
} satisfies ErrorEnvelope

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ErrorEnvelope
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


