import { IncomingMessage, ServerResponse } from 'node:http'

type ObjectWithOptionalHeaders = {
    headers?: Headers
}

type Headers = Record<string, boolean | number | string>

export type Middleware = (
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: unknown) => void,
) => void

/**
 * This function applies a middleware to a response object to update its headers.
 *
 * Primaly used for applying helmet headers to a response object.
 * Supports the express middleware signature to allow for easy integration with the existing helmet middleware.
 *
 * @param middleware express middleware to apply header changes
 * @returns response with the header changes applied
 */
export const applyMiddleware =
    (middleware: Middleware) =>
    <T extends ObjectWithOptionalHeaders>(response: T): T => {
        const headers: Headers = response.headers ? { ...response.headers } : {}
        const req = {} as IncomingMessage
        const res = {
            setHeader: (key: string, value: string) => {
                headers[key] = value
            },
            getHeader(name) {
                return headers[name]
            },
            removeHeader(name) {
                delete headers[name]
            },
        } as ServerResponse

        middleware(req, res, () => {})

        return {
            ...response,
            headers: { ...headers },
        } satisfies T
    }
