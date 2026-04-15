import typescript from "@rollup/plugin-typescript"
import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"

export default {
  input: "src/umd-entry.ts",
  output: {
    file: "dist/eruda-indexeddb.min.js",
    format: "umd",
    name: "erudaIndexedDB",
    globals: {
      eruda: "eruda",
    },

  },
  external: ["eruda"],
  plugins: [
    resolve({ browser: true }),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: false,
      sourceMap: false,
    }),
  ],
}
