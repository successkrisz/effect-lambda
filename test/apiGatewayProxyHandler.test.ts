import { APIGatewayProxyEvent } from 'aws-lambda'
import { Context, Effect } from 'effect'
import { APIGProxyEvent, APIGProxyHandler } from '../src/apiGatewayProxyHandler'

describe('APIGProxyHandler', () => {
    const createEvent = (
        body: string | null,
        isBase64Encoded: boolean = false,
        headers: { [key: string]: string | undefined } = {},
    ): APIGatewayProxyEvent => ({
        body,
        isBase64Encoded,
        headers,
        httpMethod: 'POST',
        path: '/',
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: '',
        multiValueHeaders: {},
    })

    it('should include rawHeaders in the event', async () => {
        let evt = { headers: {} } as Context.Tag.Service<APIGProxyEvent>

        const handler = APIGProxyHandler(
            APIGProxyEvent.pipe(
                Effect.tap((e) => {
                    evt = e
                }),
                Effect.as({ statusCode: 200, body: 'Woohoo' }),
            ),
        )

        const rawHeaders = { 'Content-Type': 'application/json' }
        const headers = { 'content-type': 'application/json' }
        const event = createEvent(null, false, rawHeaders)
        await handler(event, {} as any, () => {})

        expect(evt.headers).toEqual(headers)
        expect(evt.rawHeaders).toEqual(rawHeaders)
    })

    it('should include rawBody in the event', async () => {
        let evt = {} as Context.Tag.Service<APIGProxyEvent>

        const handler = APIGProxyHandler(
            APIGProxyEvent.pipe(
                Effect.tap((e) => {
                    evt = e
                }),
                Effect.as({ statusCode: 200, body: 'Woohoo' }),
            ),
        )

        const body = { foo: 'bar' }
        const rawBody = JSON.stringify(body)
        const event = createEvent(rawBody, false, {
            'Content-Type': 'application/json',
        })
        await handler(event, {} as any, () => {})

        expect(evt.body).toEqual(body)
        expect(evt.rawBody).toEqual(rawBody)
    })

    it('should return effect result without body', async () => {
        const handler = APIGProxyHandler(
            Effect.succeed({ statusCode: 200, body: 'Woohoo' }),
        )

        const event = createEvent(null, false, {})
        const result = await handler(event, {} as any, () => {})

        expect(result?.statusCode).toBe(200)
        expect(result?.body).toBe('Woohoo')
    })

    it('should return effect result with body as empty string', async () => {
        const handler = APIGProxyHandler(
            Effect.succeed({ statusCode: 200, body: 'Woohoo' }),
        )

        const event = createEvent('', false, {})
        const result = await handler(event, {} as any, () => {})

        expect(result?.statusCode).toBe(200)
        expect(result?.body).toBe('Woohoo')
    })

    it('should return 200 with body when event body is provided', async () => {
        const handler = APIGProxyHandler(
            Effect.succeed({ statusCode: 200, body: 'Woohoo' }),
        )

        const event = createEvent('string body', false, {})
        const result = await handler(event, {} as any, () => {})

        expect(result?.statusCode).toBe(200)
        expect(result?.body).toBe('Woohoo')
    })

    it('should return 200 with decoded body when event body is base64 encoded', async () => {
        const handler = APIGProxyHandler(
            Effect.succeed({ statusCode: 200, body: 'Woohoo' }),
        )

        const base64Body = Buffer.from(
            JSON.stringify({ message: 'encoded json body' }),
        ).toString('base64')
        const event = createEvent(base64Body, true, {
            'content-type': 'application/json',
        })
        const result = await handler(event, {} as any, () => {})

        expect(result?.statusCode).toBe(200)
        expect(result?.body).toBe('Woohoo')
    })

    it('should return 500 when an error occurs', async () => {
        const handler = APIGProxyHandler(
            Effect.die(new Error('Something went wrong')),
        )

        const event = createEvent(null, false, {})
        const result = await handler(event, {} as any, () => {})

        expect(result?.statusCode).toBe(500)
        expect(result?.body).toBe('Internal Server Error')
    })
})
