import { Elysia, InferContext } from "elysia";
import { InlineConfig, createServer } from "vite";

import { AppLoadContext } from "@remix-run/node";
import { Context } from "elysia/context";
import { connectToWeb } from "connect-to-web";
import { createRequestHandler } from "@remix-run/server-runtime";
import { join } from "node:path";

export type GetLoadContext = (context: Context) => AppLoadContext | Promise<AppLoadContext>;

export type RemixConfig = {
    mode?: string;
    buildDirectory?: string;
    serverEntryPointFileName?: string;
    vite?: InlineConfig;
    getLoadContext?: GetLoadContext;
};

export const remix = async (_config: RemixConfig) => {
    const plugin = new Elysia();

    const config = Object.assign(
        {
            mode: process.env.NODE_ENV ?? "development",
            buildDirectory: "build",
            serverEntryPointFileName: "index.js",
            vite: {},
        },
        _config
    );

    const buildDirectory = join(process.cwd(), config.buildDirectory);
    const clientDirectory = join(buildDirectory, "client");
    const serverEntryPoint = join(buildDirectory, "server", config.serverEntryPointFileName);

    const vite = await (async () => {
        if (config.mode !== "production") {
            return createServer({
                ...config.vite,
                server: {
                    ...config.vite?.server,
                    middlewareMode: true,
                },
            });
        }
        return null;
    })();

    let hooks = {};

    if (vite) {
        hooks = {
            beforeHandle: ({ request }: InferContext<typeof plugin>) => {
                return connectToWeb((req, res, next) => {
                    vite.middlewares(req, res, next);
                })(request);
            },
        };
    } else {
        const glob = new Bun.Glob(clientDirectory + "/**");
        for (const path of glob.scanSync()) {
            plugin.get(path.replace(clientDirectory, ""), async () => {
                return Bun.file(path);
            });
        }
    }

    plugin.all(
        "*",
        async (c) => {
            const context = (await config.getLoadContext?.(c)) ?? {};
            const build: any = await (async () => {
                if (vite) {
                    return vite.ssrLoadModule("virtual:remix/server-build");
                }
                return import(serverEntryPoint);
            })();
            return createRequestHandler(build, config.mode)(c.request, context);
        },
        hooks
    );

    return plugin;
};
