import { ServerResponse } from 'node:http'
import { Schema } from '@effect/schema'
import { APIGatewayProxyEvent as AwsAPIGatewayProxyEvent } from 'aws-lambda'
import { Context, Effect, pipe } from 'effect'
import { applyMiddleware, Middleware } from '../src/applyMiddleware'
import {
    APIGatewayProxyEvent,
    toLambdaHandler,
    HandlerEffect,
    schemaBodyJson,
    schemaPathParams,
} from '../src/RestApi'

describe('APIGProxyHandler', () => {
    const createEvent = (
        body: string | null,
        isBase64Encoded: boolean = false,
        headers: { [key: string]: string | undefined } = {},
    ): AwsAPIGatewayProxyEvent => ({
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
        let evt = { headers: {} } as Context.Tag.Service<APIGatewayProxyEvent>

        const handler = APIGatewayProxyEvent.pipe(
            Effect.tap((e) => {
                evt = e
            }),
            Effect.as({ statusCode: 200, body: 'Woohoo' }),
            toLambdaHandler,
        )

        const rawHeaders = { 'Content-Type': 'application/json' }
        const headers = { 'content-type': 'application/json' }
        const event = createEvent(null, false, rawHeaders)
        await handler(event, {} as any, () => {})

        expect(evt.headers).toEqual(headers)
        expect(evt.rawHeaders).toEqual(rawHeaders)
    })

    it('should include rawBody in the event', async () => {
        let evt = {} as Context.Tag.Service<APIGatewayProxyEvent>

        const handler = toLambdaHandler(
            APIGatewayProxyEvent.pipe(
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
        const handler = toLambdaHandler(
            Effect.succeed({ statusCode: 200, body: 'Woohoo' }),
        )

        const event = createEvent(null, false, {})
        const result = await handler(event, {} as any, () => {})

        expect(result?.statusCode).toBe(200)
        expect(result?.body).toBe('Woohoo')
    })

    it('should return effect result with body as empty string', async () => {
        const handler = toLambdaHandler(
            Effect.succeed({ statusCode: 200, body: 'Woohoo' }),
        )

        const event = createEvent('', false, {})
        const result = await handler(event, {} as any, () => {})

        expect(result?.statusCode).toBe(200)
        expect(result?.body).toBe('Woohoo')
    })

    it('should return 200 with body when event body is provided', async () => {
        const handler = toLambdaHandler(
            Effect.succeed({ statusCode: 200, body: 'Woohoo' }),
        )

        const event = createEvent('string body', false, {})
        const result = await handler(event, {} as any, () => {})

        expect(result?.statusCode).toBe(200)
        expect(result?.body).toBe('Woohoo')
    })

    it('should return 200 with decoded body when event body is base64 encoded', async () => {
        const handler = toLambdaHandler(
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
        const handler = toLambdaHandler(
            Effect.die(new Error('Something went wrong')),
        )

        const event = createEvent(null, false, {})
        const result = await handler(event, {} as any, () => {})

        expect(result?.statusCode).toBe(500)
        expect(result?.body).toBe(
            JSON.stringify({ message: 'Internal Server Error' }),
        )
    })

    it('should return 400 when event body is not valid JSON', async () => {
        const handler = toLambdaHandler(
            Effect.succeed({ statusCode: 200, body: 'Woohoo' }),
        )

        const event = createEvent('invalid json', false, {
            'content-type': 'application/json',
        })
        const result = await handler(event, {} as any, () => {})

        expect(result?.statusCode).toBe(400)
        expect(result?.body).toBe(
            JSON.stringify({ message: 'Payload is not a valid JSON' }),
        )
    })

    // ====================
    // Readme examples
    // ====================
    it('should access input event as in the readme example', async () => {
        const PayloadSchema = Schema.Struct({
            message: Schema.String,
        })
        const PathParamsSchema = Schema.Struct({
            name: Schema.String,
        })
        const handler = toLambdaHandler(
            schemaPathParams(PathParamsSchema).pipe(
                Effect.map(({ name }) => name),
                Effect.bindTo('name'),
                Effect.bind('message', () =>
                    schemaBodyJson(PayloadSchema).pipe(
                        Effect.map((x) => x.message),
                    ),
                ),
                Effect.map(({ name, message }) => ({
                    statusCode: 200,
                    body: `Hello ${name}, ${message}`,
                })),
                Effect.catchTag('ParseError', () =>
                    Effect.succeed({
                        statusCode: 400,
                        body: 'Invalid JSON',
                    }),
                ),
            ),
        )

        const event = {
            ...createEvent(JSON.stringify({ message: 'goodbye!' }), false, {
                'Content-Type': 'application/json',
            }),
            pathParameters: { name: 'John' },
        }

        const result = await handler(event, {} as any, () => {})

        expect(result?.statusCode).toBe(200)
        expect(result?.body).toBe('Hello John, goodbye!')
    })

    it('should work with the helmet middleware applied', async () => {
        const middleware = jest
            .fn()
            .mockImplementation((_, res: ServerResponse) => {
                res.setHeader('X-XSS-Protection', '0')
            }) as Middleware

        const handlerEffect: HandlerEffect = Effect.succeed({
            statusCode: 200,
            body: 'Woohoo',
        })
        const handler = pipe(
            handlerEffect,
            Effect.map(applyMiddleware(middleware)),
            toLambdaHandler,
        )

        const event = createEvent(null, false, {})
        const result = await handler(event, {} as any, () => {})

        expect(result).toEqual({
            statusCode: 200,
            body: 'Woohoo',
            headers: { 'X-XSS-Protection': '0' },
        })
        expect
    })
})
