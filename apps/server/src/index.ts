import { createApp } from './app'
import { initializeDatabase } from './db/init'
import { env } from './env'
import { poller } from './services/poller'

initializeDatabase()

const app = createApp(poller)

poller.start()

const server = Bun.serve({
    port: env.port,
    hostname: env.host,
    fetch: app.fetch,
})

console.info(`[kendo3] listening on http://${server.hostname}:${server.port}`)

for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
        console.info(`[kendo3] received ${signal}, shutting down`)
        poller.stop()
        server.stop()
        process.exit(0)
    })
}
