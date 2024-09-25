# ElysiaJS Remix

Remix integration for ElysiaJS.

This plugin allows you to serve your Remix application through your Elysia server.

[Installation](#installation)  
[Acknowledgements](#cknowledgments)

## Installation

1. `npm install elysiajs-remix`
2. Setup your Elysia server:

```ts
// src/index.ts
import { elysia } from "Elysia";
import { remix } from "elysiajs-remix";

const app = new Elysia().use(remix()).listen(5173);
```

3. Configure vite config:

```js
// vite.config.js
import { defineConfig } from "vite";
import { vitePlugin as remix } from "@remix-run/dev";

export default defineConfig({
    plugins: [remix()],
});
```

## Acknowledgments

This project uses code from the following sources:

-   [Vike Node](https://github.com/vikejs/vike-node/tree/main) - `connectToWeb` utility for converting connect middleware to wintercg compaitable response/request objects.
