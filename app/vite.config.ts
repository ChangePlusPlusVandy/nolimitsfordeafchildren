import { createRequire } from "node:module";

import { cloudflare } from "@cloudflare/vite-plugin";
import vinext from "vinext";
import { defineConfig } from "vite";

const require = createRequire(import.meta.url);

export default defineConfig({
  plugins: [
    vinext(),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
  optimizeDeps: {
    // Pre-bundle CJS-only transitives default/named-imported by MUI
    // component modules. Served raw in dev, their ESM named/default imports
    // have no interop and crash lazily loaded routes (e.g. /students) on
    // navigation. Bundled, esbuild provides proper interop. Plain JS, so
    // the rsc/ssr environments handle them safely.
    include: ["prop-types", "react-is"],
  },
  resolve: {
    // `@emotion/react` default-imports the CJS-only
    // `hoist-non-react-statics`, which has no `.default` under strict ESM
    // interop and crashes client hydration when served raw in dev. Resolve
    // to the package's own ESM source instead. Revisit when it ships ESM.
    alias: [
      {
        find: "hoist-non-react-statics",
        replacement: require.resolve("hoist-non-react-statics/src/index.js"),
      },
    ],
  },
});
