# vite-server

[![npm](https://img.shields.io/npm/v/vite-server)](https://www.npmjs.com/package/vite-server)
![GitHub top language](https://img.shields.io/github/languages/top/david-plugge/vite-server)
![GitHub Workflow Status (with branch)](https://img.shields.io/github/actions/workflow/status/david-plugge/vite-server/main.yaml?branch=main)

Make use of hot module reloading and the huge ecosystem of vite for your server applications.

## Installation

```bash
# npm
npm i vite-server

# pnpm
pnpm i vite-server

# yarn
yarn add vite-server
```

## Examples

-   [http](https://github.com/david-plugge/vite-server/tree/main/examples/http)
-   [fastify](https://github.com/david-plugge/vite-server/tree/main/examples/fastify)
-   [express](https://github.com/david-plugge/vite-server/tree/main/examples/express)

It´s a little slower, but instead of using the vite http server you can also create a custom http server.

-   [custom-server](https://github.com/david-plugge/vite-server/tree/main/examples/custom-server)

## Config

```ts
// vite.config.js
import { defineConfig } from 'vite';
import viteServer from 'vite-server';

export default defineConfig({
    plugins: [
        viteServer({
            input: 'src/index.ts',

            // set this to true to create a new vite server in the background
            // useful if you also have a vite frontend application
            standalone: false, // default
        }),
    ],
    clearScreen: false,
});
```

## License

[MIT](https://github.com/david-plugge/vite-server/blob/main/LICENSE)
