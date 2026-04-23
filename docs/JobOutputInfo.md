
# JobOutputInfo


## Properties

Name | Type
------------ | -------------
`state` | string
`container` | string
`audio` | boolean
`target_height` | number
`width` | number
`height` | number
`bytes` | number
`sha256` | string
`retention_expires_at` | Date

## Example

```typescript
import type { JobOutputInfo } from '@liqhtworks/sophon-sdk'

// TODO: Update the object below with actual values
const example = {
  "state": null,
  "container": null,
  "audio": null,
  "target_height": 1080,
  "width": 1920,
  "height": 1080,
  "bytes": null,
  "sha256": null,
  "retention_expires_at": null,
} satisfies JobOutputInfo

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as JobOutputInfo
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


