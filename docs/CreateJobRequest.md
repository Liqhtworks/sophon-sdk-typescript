
# CreateJobRequest


## Properties

Name | Type
------------ | -------------
`source` | [UploadJobSource](UploadJobSource.md)
`profile` | [JobProfile](JobProfile.md)
`output` | [CreateJobOutputOptions](CreateJobOutputOptions.md)
`webhook_ids` | Array&lt;string&gt;
`metadata` | { [key: string]: any; }

## Example

```typescript
import type { CreateJobRequest } from '@liqhtworks/sophon-sdk'

// TODO: Update the object below with actual values
const example = {
  "source": null,
  "profile": null,
  "output": null,
  "webhook_ids": null,
  "metadata": null,
} satisfies CreateJobRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreateJobRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


