
# CreateJobOutputOptions

Optional output shaping knobs for a new job.

## Properties

Name | Type
------------ | -------------
`container` | [OutputContainer](OutputContainer.md)
`audio` | boolean
`target_height` | number

## Example

```typescript
import type { CreateJobOutputOptions } from '@liqhtworks/sophon-sdk'

// TODO: Update the object below with actual values
const example = {
  "container": null,
  "audio": null,
  "target_height": 1080,
} satisfies CreateJobOutputOptions

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreateJobOutputOptions
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


