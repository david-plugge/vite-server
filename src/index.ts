import path from 'path';
import {
    createServer,
    ModuleNode,
    Plugin,
    build as viteBuild,
    UserConfig,
} from 'vite';
import { ViteNodeRunner } from 'vite-node/client';
import { ViteNodeServer } from 'vite-node/server';
import { installSourcemapsSupport } from 'vite-node/source-map';

interface ViteServerOptions {
    standalone?: boolean;
    input: string;
}

function getConfig(input: string): UserConfig {
    return {
        appType: 'custom',
        build: {
            rollupOptions: {
                input,
            },
            ssr: true,
            target: 'node16',
        },
        publicDir: false,
        optimizeDeps: {
            disabled: true,
        },
    };
}

function debounce<T extends any[]>(
    cb: (...args: T) => void,
    ms: number,
): (...args: T) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            cb(...args);
        }, ms);
    };
}

function notImplementedError(name: string) {
    return new Error(`'${name}' not implemented`);
}

export default function viteServer({
    input,
    standalone = false,
}: ViteServerOptions): Plugin {
    input = path.resolve(input);

    return {
        name: 'vite-server',
        config() {
            if (!standalone) {
                return getConfig(input);
            }
        },
        async configureServer(vite) {
            const invalidates = new Set<string>();

            function markInvalidate(mod: ModuleNode) {
                if (!mod.id) return;
                if (invalidates.has(mod.id)) return;

                invalidates.add(mod.id);
                markInvalidates(mod.importers);
            }

            function markInvalidates(mods?: ModuleNode[] | Set<ModuleNode>) {
                if (!mods) {
                    return;
                }
                for (const mod of mods) {
                    markInvalidate(mod);
                }
            }

            const viteDevServer = standalone
                ? await createServer(getConfig(input))
                : vite;

            // create vite-node server
            const node = new ViteNodeServer(viteDevServer, {
                transformMode: {
                    ssr: [/.*/],
                    web: [],
                },
            });

            // fixes stacktraces in Errors
            installSourcemapsSupport({
                getSourceMap: (source) => node.getSourceMap(source),
            });

            const dataMap = new Map<string, any>();

            // create vite-node runner
            const runner = new ViteNodeRunner({
                root: viteDevServer.config.root,
                base: viteDevServer.config.base,
                createHotContext(_runner, url) {
                    if (!dataMap.has(url)) {
                        dataMap.set(url, {
                            viteHttpServer: viteDevServer.httpServer,
                        });
                    }
                    return {
                        get data() {
                            return dataMap.get(url);
                        },
                        accept(deps?: any, callback?: any) {
                            throw notImplementedError('import.meta.hot.accept');
                        },
                        acceptExports(_, cb) {
                            throw notImplementedError(
                                'import.meta.hot.acceptExports',
                            );
                        },
                        dispose(cb) {
                            throw notImplementedError(
                                'import.meta.hot.dispose',
                            );
                        },
                        prune(cb) {
                            throw notImplementedError('import.meta.hot.prune');
                        },
                        invalidate(message) {
                            throw notImplementedError(
                                'import.meta.hot.invalidate',
                            );
                        },
                        on(event, cb) {
                            throw notImplementedError('import.meta.hot.on');
                        },
                        send(event, data) {
                            throw notImplementedError('import.meta.hot.send');
                        },
                    };
                },
                fetchModule(id) {
                    return node.fetchModule(id.replace(/\/\//g, '/'));
                },
                resolveId(id, importer) {
                    return node.resolveId(id, importer);
                },
            });

            const run = async () => {
                try {
                    await runner.executeFile(input);
                } catch (err) {
                    console.error(err);
                }
            };

            const scheduleRun = debounce(() => {
                const invalidated =
                    runner.moduleCache.invalidateDepTree(invalidates);

                invalidates.clear();

                if (invalidated.has(input)) {
                    run();
                }
            }, 100);

            viteDevServer.watcher.on('all', (_event, file) => {
                markInvalidates(
                    viteDevServer.moduleGraph.getModulesByFile(file),
                );
                scheduleRun();
            });

            run();
        },
        async closeBundle() {
            if (standalone) {
                await viteBuild({
                    ...getConfig(input),
                    configFile: false,
                });
            }
        },
    };
}
