
# JobProgress


## Properties

Name | Type
------------ | -------------
`stage` | string
`phase` | [JobStatus](JobStatus.md)
`percent` | number
`phase_percent` | number
`fps` | number
`eta_seconds` | number
`frames_done` | number
`frames_total` | number

## Example

```typescript
import type { JobProgress } from '@liqhtworks/sophon-sdk'

// TODO: Update the object below with actual values
const example = {
  "stage": null,
  "phase": null,
  "percent": null,
  "phase_percent": null,
  "fps": null,
  "eta_seconds": null,
  "frames_done": null,
  "frames_total": null,
} satisfies JobProgress

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as JobProgress
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


