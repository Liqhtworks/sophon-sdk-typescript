
# JobSourceInfo


## Properties

Name | Type
------------ | -------------
`name` | string
`bytes` | number
`sha256` | string
`duration_seconds` | number
`resolution` | string
`frame_rate` | string

## Example

```typescript
import type { JobSourceInfo } from '@liqhtworks/sophon-sdk'

// TODO: Update the object below with actual values
const example = {
  "name": null,
  "bytes": null,
  "sha256": null,
  "duration_seconds": null,
  "resolution": 1920x1080,
  "frame_rate": 23.976,
} satisfies JobSourceInfo

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as JobSourceInfo
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


