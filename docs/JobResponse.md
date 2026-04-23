
# JobResponse


## Properties

Name | Type
------------ | -------------
`id` | string
`status` | [JobStatus](JobStatus.md)
`status_reason` | string
`attempt` | number
`retryable` | boolean
`profile` | [JobProfile](JobProfile.md)
`effective_profile_id` | string
`source` | [JobSourceInfo](JobSourceInfo.md)
`progress` | [JobProgress](JobProgress.md)
`output` | [JobOutputInfo](JobOutputInfo.md)
`metadata` | { [key: string]: any; }
`created_at` | Date
`started_at` | Date
`completed_at` | Date
`error` | string

## Example

```typescript
import type { JobResponse } from '@liqhtworks/sophon-sdk'

// TODO: Update the object below with actual values
const example = {
  "id": job_abc123def456,
  "status": null,
  "status_reason": null,
  "attempt": null,
  "retryable": null,
  "profile": null,
  "effective_profile_id": null,
  "source": null,
  "progress": null,
  "output": null,
  "metadata": null,
  "created_at": null,
  "started_at": null,
  "completed_at": null,
  "error": null,
} satisfies JobResponse

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as JobResponse
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


