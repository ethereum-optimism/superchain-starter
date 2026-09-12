import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'node',
        testTimeout: 30000, // 30 seconds
        hookTimeout: 30000,
        include: ['src/test/**/*.test.ts'],
    },
}) 