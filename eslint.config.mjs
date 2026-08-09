import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "coverage/**",
    "legacy/**",
    "attached_assets/**",
    "assets/**",
    "server/**",
    "test-*.js",
    "api.js",
    "config.js",
    "db.js",
    "script.js",
    "server.js",
  ]),
]);
