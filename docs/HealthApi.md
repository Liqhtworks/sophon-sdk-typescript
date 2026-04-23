# HealthApi

All URIs are relative to *https://api.liqhtworks.xyz*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**healthz**](HealthApi.md#healthz) | **GET** /healthz | Liveness probe |
| [**readyz**](HealthApi.md#readyz) | **GET** /readyz | Readiness probe |



## healthz

> healthz()

Liveness probe

Always returns 200. Used by load balancers and orchestrators.

### Example

```ts
import {
  Configuration,
  HealthApi,
} from '@liqhtworks/sophon-sdk';
import type { HealthzRequest } from '@liqhtworks/sophon-sdk';

async function example() {
  console.log("🚀 Testing @liqhtworks/sophon-sdk SDK...");
  const api = new HealthApi();

  try {
    const data = await api.healthz();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Service is alive. |  * X-Request-Id -  <br>  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## readyz

> ReadyResponse readyz()

Readiness probe

Returns 200 when the service is ready to accept traffic. Checks database connectivity, disk headroom (warning and critical thresholds), worker liveness, and drain state. 

### Example

```ts
import {
  Configuration,
  HealthApi,
} from '@liqhtworks/sophon-sdk';
import type { ReadyzRequest } from '@liqhtworks/sophon-sdk';

async function example() {
  console.log("🚀 Testing @liqhtworks/sophon-sdk SDK...");
  const api = new HealthApi();

  try {
    const data = await api.readyz();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**ReadyResponse**](ReadyResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | All readiness checks passed. |  * X-Request-Id -  <br>  |
| **503** | One or more readiness checks failed. |  * X-Request-Id -  <br>  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

