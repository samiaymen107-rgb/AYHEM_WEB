# AYHEM AI Network Client

Reusable browser/server JavaScript client for the AYHEM HTTPS AI gateway.

## Requirements

- Node.js 20+ for the included tests.
- A deployed HTTPS AYHEM Worker endpoint.
- A valid runtime endpoint URL. Never put provider API credentials in this client.

## Example

```js
import { createAyhemAIClient } from "./ayhem-ai-client.js";

const ai = createAyhemAIClient({
  endpoint: window.AYHEM_WORKER_URL,
});

const health = await ai.health();
if (health.aiConfigured !== true) {
  throw new Error("AYHEM AI provider is not configured.");
}

const result = await ai.ask("حلل هذه المعلومة");
console.log(result.output);
```

Do not log prompts or sensitive output in production. The health check is metadata only; verify provider readiness before sending requests.

## Tests

Run `npm test` from this directory with Node.js 20 or newer.

See [network contract](../../docs/AYHEM_AI_NETWORK_MESH_V1.md) and [operation reports](../../docs/operations/README.md).
