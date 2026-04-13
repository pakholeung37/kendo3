import type http from 'node:http'
import type https from 'node:https'

import type { HeaderGeneratorOptions } from 'header-generator'

import { config } from '@/config'
import { generatedHeaders as HEADER_LIST, generateHeaders } from '@/utils/header-generator'
import logger from '@/utils/logger'
import proxy from '@/utils/proxy'

type Get = typeof http.get | typeof https.get | typeof http.request | typeof https.request

interface ExtendedRequestOptions extends http.RequestOptions {
    headerGeneratorOptions?: Partial<HeaderGeneratorOptions>
    href?: string
    search?: string
    query?: string | Record<string, string> | URLSearchParams
}

const getWrappedGet = <T extends Get>(origin: T): T =>
    ((function (this: any, ...args: Parameters<T>) {
        let url: URL | null
        let options: ExtendedRequestOptions = {}
        let callback: ((res: http.IncomingMessage) => void) | undefined
        if (typeof args[0] === 'string' || args[0] instanceof URL) {
            url = new URL(args[0])
            if (typeof args[1] === 'object') {
                options = args[1]
                callback = args[2]
            } else if (typeof args[1] === 'function') {
                options = {}
                callback = args[1]
            }
        } else {
            options = args[0]
            try {
                url = new URL(options.href || `${options.protocol || 'http:'}//${options.hostname || options.host}${options.path}${options.search || (options.query ? `?${options.query}` : '')}`)
            } catch {
                url = null
            }
            if (typeof args[1] === 'function') {
                callback = args[1]
            }
        }
        if (!url) {
            return Reflect.apply(origin, this, args) as ReturnType<typeof origin>
        }

        logger.debug(`Outgoing request: ${options.method || 'GET'} ${url}`)

        const headers = ((options.headers as http.OutgoingHttpHeaders | undefined) ?? {}) as Record<string, any>
        options.headers = headers
        const headersLowerCaseKeys = new Set(Object.keys(headers).map((key) => key.toLowerCase()))

        // ua
        if (config.isDefaultUA || options.headerGeneratorOptions) {
            const generatedHeaders = generateHeaders(options.headerGeneratorOptions)

            if (!headersLowerCaseKeys.has('user-agent')) {
                headers['user-agent'] = generatedHeaders['user-agent']
            }

            for (const header of HEADER_LIST) {
                if (!headersLowerCaseKeys.has(header) && generatedHeaders[header]) {
                    headers[header] = generatedHeaders[header]
                }
            }
        } else if (!headersLowerCaseKeys.has('user-agent')) {
            headers['user-agent'] = config.ua
        }

        // referer
        if (!headersLowerCaseKeys.has('referer')) {
            headers.referer = url.origin
        }

        // proxy
        if (!options.agent && proxy.agent) {
            const proxyRegex = new RegExp(proxy.proxyObj.url_regex)

            if (
                proxyRegex.test(url.toString()) &&
                url.protocol.startsWith('http') &&
                url.host !== proxy.proxyUrlHandler?.host &&
                url.host !== 'localhost' &&
                !url.host.startsWith('127.') &&
                !(config.puppeteerWSEndpoint?.includes(url.host) ?? false)
            ) {
                options.agent = proxy.agent
            }
        }

        // Remove the headerGeneratorOptions before passing to the original function
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { headerGeneratorOptions, ...cleanOptions } = options

        return Reflect.apply(origin, this, [url, cleanOptions, callback]) as ReturnType<typeof origin>
    }) as unknown) as T

export default getWrappedGet
