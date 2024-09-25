import { createRequestHandler } from "@remix-run/server-runtime";
import { Elysia } from "elysia";
import { createServer, InlineConfig } from "vite";
import { join } from "node:path";
import { connectToWeb } from "./connectToWeb";

type RemixConfig = {
    mode?: string;
    buildDirectory?: string;
    serverEntryPointFileName?: string;
    vite?: InlineConfig;
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

    const build: any = await (async () => {
        if (vite) {
            return vite.ssrLoadModule("virtual:remix/server-build");
        }
        return import(serverEntryPoint);
    })();

    if (vite) {
        plugin.onRequest(async ({ request }) => {
            return connectToWeb((req, res, next) => {
                vite.middlewares(req, res, next);
            })(request);
        });
    } else {
        const glob = new Bun.Glob(clientDirectory + "/**");
        for (const path of glob.scanSync()) {
            plugin.get(path.replace(clientDirectory, ""), async () => {
                return Bun.file(path);
            });
        }
    }

    plugin.all("*", async (c) => {
        return createRequestHandler(build, config.mode)(c.request, c);
    });

    return plugin;
};
