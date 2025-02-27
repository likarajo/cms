import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config.js';

export default defineConfig({
    ...viteConfig, // use viteConfig
    test: {
        globals: true,   // for global test functions (describe, it, expect, etc.)
        environment: 'jsdom', // for front-end projects (React)
        setupFiles: ['./vitest.setup.js'],  // global mocking/setup
        coverage: {
            reporter: ['text', 'html'],  // for coverage reports
        },
    },
});
