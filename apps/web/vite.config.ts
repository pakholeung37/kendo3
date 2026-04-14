import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const serverPort = process.env.PORT ?? '1200'
const serverOrigin = process.env.KENDO3_SERVER_ORIGIN ?? `http://127.0.0.1:${serverPort}`

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
    server: {
        proxy: {
            '/api': serverOrigin,
            '/healthz': serverOrigin,
            '/favicon.ico': serverOrigin,
            '/logo.png': serverOrigin,
        },
    },
})
