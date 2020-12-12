# serverless performance comparison

I want to put rust, node, go, and deno head to head.

**Build**

`npm run build`

**Invoke**

node invoke.js

Env vars:

- `SERVICES`: One, or many of: `go`, `node`, `node-ts`, `rust`
- `INVOCATIONS` Number of invocations. Default is 2000
