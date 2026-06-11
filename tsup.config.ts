import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    client: "src/client.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: false,
  clean: true,
  splitting: false,
  external: ["react", "react-dom", "next", "@neondatabase/serverless", "zod"],
  outDir: "dist",
});
