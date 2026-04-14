import tsconfigPaths from 'vite-tsconfig-paths'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        watch: false,
        environment: 'node',
        include: ['src/**/*.test.ts'],
        coverage: {
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.test.ts'],
        },
        testTimeout: 10000,
        exclude: [...configDefaults.exclude],
    },
})
