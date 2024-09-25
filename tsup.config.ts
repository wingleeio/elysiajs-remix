import { defineConfig } from "tsup";

export default defineConfig({
    entry: {
        index: "src/index.ts",
    },
    format: ["cjs", "esm"],
    outDir: "dist",
    splitting: false,
    external: ["@remix-run/server-runtime", "elysia", "vite"],
    esbuildOptions: (options, context) => {
        if (context.format === "esm") {
            options.outExtension = { ".js": ".mjs" };
        } else if (context.format === "cjs") {
            options.outExtension = { ".js": ".cjs" };
        }
    },
});
