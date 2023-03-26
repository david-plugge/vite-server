import { defineConfig } from 'vite';
import viteServer from 'vite-server';

export default defineConfig({
    plugins: [
        viteServer({
            input: 'src/index.ts',
        }),
    ],
    clearScreen: false,
});
