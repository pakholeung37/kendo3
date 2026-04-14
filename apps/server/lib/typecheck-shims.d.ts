declare module '@jocmp/mercury-parser' {
    const Parser: {
        parse(url: string, options?: Record<string, unknown>): Promise<Record<string, any>>
    }

    export default Parser
}
