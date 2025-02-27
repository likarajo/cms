import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    base: "/",
    plugins: [react()],
    preview: {
      port: 4000,
      strictPort: true,
    },
    server: {
      port: 4000,
      strictPort: true,
      host: "0.0.0.0",
      cors: true,
    },
    define: {
        // By default, Vite doesn't include shims for NodeJS/
        // necessary for react-draft-wysiwyg lib to work
      global: {},
    },
    resolve: {
      alias: {
        // eslint-disable-next-line no-undef
        "@": path.resolve(__dirname, "src"),
        react: "react",
        "react-dom": "react-dom",
      },
    },
    build: {
      rollupOptions: {
        // Use external to prevent bundling of test files
        external: [/\.test\.jsx$/, /\.spec\.jsx$/, /\.setupTests.jsx/],
        output: {
          manualChunks: {
            worker: [],
          },
        },
      },
      commonjsOptions: {
        include: [/node_modules/],
      },
    },
});
