declare module 'bun:sqlite' {
    export interface Changes {
        changes: number
        lastInsertRowid: number | bigint
    }

    export interface Statement<Params = Record<string, unknown>> {
        all(params?: Params): unknown[]
        get(params?: Params): unknown
        values(params?: Params): unknown[][]
        run(params?: Params): Changes
    }

    export class Database {
        constructor(filename?: string, options?: { create?: boolean; readonly?: boolean; readwrite?: boolean })
        exec(query: string): void
        query<Params = Record<string, unknown>>(query: string): Statement<Params>
        close(): void
    }
}

declare const Bun: {
    serve(options: {
        port: number
        hostname?: string
        fetch: (request: Request) => Response | Promise<Response>
    }): {
        hostname: string
        port: number
        stop(closeActiveConnections?: boolean): void
    }
}
