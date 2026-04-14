import { destr } from 'destr'

import ofetch from '@/utils/ofetch'

import { getSearchParamsString } from './helpers'

type RequestLike = string | Request | ({ url: string } & Record<string, any>)
type FakeGotOptions = Record<string, any>

const getFakeGot = (defaultOptions?: any) => {
    const fakeGot = async (request: RequestLike, options?: FakeGotOptions) => {
        let requestUrl: string | Request = typeof request === 'string' || request instanceof Request ? request : request.url
        if (!(typeof request === 'string' || request instanceof Request) && request.url) {
            options = {
                ...request,
                ...options,
            }
            requestUrl = request.url
        }
        let resolvedOptions: FakeGotOptions = options ?? {}
        if (resolvedOptions.hooks?.beforeRequest) {
            for (const hook of resolvedOptions.hooks.beforeRequest) {
                hook(resolvedOptions)
            }
            delete resolvedOptions.hooks
        }

        resolvedOptions = {
            ...defaultOptions,
            ...resolvedOptions,
        }

        if (resolvedOptions.json && !resolvedOptions.body) {
            resolvedOptions.body = resolvedOptions.json
            delete resolvedOptions.json
        }
        if (resolvedOptions.form && !resolvedOptions.body) {
            resolvedOptions.body = new URLSearchParams(resolvedOptions.form as Record<string, string>).toString()
            if (!resolvedOptions.headers) {
                resolvedOptions.headers = {}
            }
            resolvedOptions.headers['content-type'] = 'application/x-www-form-urlencoded'
            delete resolvedOptions.form
        }
        if (resolvedOptions.searchParams && typeof requestUrl === 'string') {
            requestUrl += '?' + getSearchParamsString(resolvedOptions.searchParams)
            delete resolvedOptions.searchParams
        }

        // Add support for buffer responseType, to be compatible with got
        resolvedOptions.parseResponse = (responseText: string) => ({
            data: destr(responseText),
            body: responseText,
        })

        if (resolvedOptions.responseType === 'buffer' || resolvedOptions.responseType === 'arrayBuffer') {
            resolvedOptions.responseType = 'arrayBuffer'
            delete resolvedOptions.parseResponse
        }

        if (resolvedOptions.cookieJar) {
            const cookies = resolvedOptions.cookieJar.getCookiesSync(requestUrl)
            if (cookies.length) {
                if (!resolvedOptions.headers) {
                    resolvedOptions.headers = {}
                }
                resolvedOptions.headers.cookie = cookies.join('; ')
            }
            delete resolvedOptions.cookieJar
        }

        const response = ofetch(requestUrl, resolvedOptions)

        if (resolvedOptions.responseType === 'arrayBuffer') {
            const responseData = await response
            return {
                data: Buffer.from(responseData),
                body: Buffer.from(responseData),
            }
        }
        return response
    }

    fakeGot.get = (request: RequestLike, options?: FakeGotOptions) => fakeGot(request, { ...options, method: 'GET' })
    fakeGot.post = (request: RequestLike, options?: FakeGotOptions) => fakeGot(request, { ...options, method: 'POST' })
    fakeGot.put = (request: RequestLike, options?: FakeGotOptions) => fakeGot(request, { ...options, method: 'PUT' })
    fakeGot.patch = (request: RequestLike, options?: FakeGotOptions) => fakeGot(request, { ...options, method: 'PATCH' })
    fakeGot.head = (request: RequestLike, options?: FakeGotOptions) => fakeGot(request, { ...options, method: 'HEAD' })
    fakeGot.delete = (request: RequestLike, options?: FakeGotOptions) => fakeGot(request, { ...options, method: 'DELETE' })
    fakeGot.extend = (options: FakeGotOptions) => getFakeGot(options)

    return fakeGot
}

export default getFakeGot()
