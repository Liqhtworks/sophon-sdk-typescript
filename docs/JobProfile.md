
# JobProfile

Encoding profile ID. Coffee-themed naming: prep time maps to encode speed, bare name is the 8-bit default (universal decoder compatibility), `-10bit` suffix opts into HEVC Main10 for higher-quality playback on newer decoders.  **8-bit (default):** - `sophon-espresso` — fastest, lowest compression - `sophon-cortado` — balanced speed and quality - `sophon-americano` — slowest, highest compression  **10-bit (HEVC Main10):** - `sophon-espresso-10bit` - `sophon-cortado-10bit` - `sophon-americano-10bit`  **Adaptive dispatcher:** - `sophon-auto` — public opt-in profile. The worker classifies   the source and records the concrete `effective_profile_id` on   the job once dispatch resolves. 

## Properties

Name | Type
------------ | -------------

## Example

```typescript
import type { JobProfile } from '@liqhtworks/sophon-sdk'

// TODO: Update the object below with actual values
const example = {
} satisfies JobProfile

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as JobProfile
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


