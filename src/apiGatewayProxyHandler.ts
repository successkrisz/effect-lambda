import { Schema } from '@effect/schema'
import { ParseOptions } from '@effect/schema/AST'
import {
    APIGatewayProxyEvent,
    APIGatewayProxyEventHeaders,
    APIGatewayProxyHandler,
    APIGatewayProxyResult,
} from 'aws-lambda'
import { Console, Context, Effect, Layer, pipe } from 'effect'
import { HandlerContext } from './handler'
import { headerNormalizer } from './headerNormalizer'
import { jsonBodyParser } from './jsonBodyParser'

export class APIGProxyEvent extends Context.Tag(
    '@effect-lambda/APIGProxyEvent',
)<
    APIGProxyEvent,
    APIGatewayProxyEvent & {
        rawHeaders?: APIGatewayProxyEventHeaders
        rawBody?: unknown
    }
>() {}

/**
 * Utility to parse the body of an API Gateway event into a type.
 */
export const schemaBodyJson = <A, I, R extends never>(
    schema: Schema.Schema<A, I, R>,
    options?: ParseOptions | undefined,
) =>
    APIGProxyEvent.pipe(
        Effect.map(({ body }) => body as unknown),
        Effect.flatMap((body) =>
            Schema.decodeUnknownEither(schema, options)(body),
        ),
    )

/**
 * Utility to parse the query parameters of an API Gateway event into a type.
 */
export const schemaPathParams = <A, I, R extends never>(
    schema: Schema.Schema<A, I, R>,
    options?: ParseOptions | undefined,
) =>
    APIGProxyEvent.pipe(
        Effect.map(({ pathParameters }) => pathParameters || {}),
        Effect.flatMap((pathParameters) =>
            Schema.decodeUnknownEither(schema, options)(pathParameters),
        ),
    )

export const schemaQueryParams = <A, I, R extends never>(
    schema: Schema.Schema<A, I, R>,
    options?: ParseOptions | undefined,
) =>
    APIGProxyEvent.pipe(
        Effect.map(({ queryStringParameters }) => queryStringParameters || {}),
        Effect.flatMap((queryStringParameters) =>
            Schema.decodeUnknownEither(schema, options)(queryStringParameters),
        ),
    )

export const PathParameters = APIGProxyEvent.pipe(
    Effect.map((x) => x.pathParameters || {}),
)

export type HandlerEffect = Effect.Effect<
    APIGatewayProxyResult,
    never,
    never | APIGProxyEvent | HandlerContext
>

export const APIGProxyHandler =
    (effect: HandlerEffect): APIGatewayProxyHandler =>
    async (event, context) =>
        effect.pipe(
            Effect.provide(
                Layer.effect(
                    APIGProxyEvent,
                    pipe(event, headerNormalizer, jsonBodyParser),
                ),
            ),
            Effect.catchTag('ParseError', () =>
                Effect.succeed({ statusCode: 400, body: 'Invalid JSON' }),
            ),
            Effect.provide(Layer.succeed(HandlerContext, context)),
            Effect.tapDefect(Console.error),
            Effect.catchAllDefect(() =>
                Effect.succeed({
                    statusCode: 500,
                    body: 'Internal Server Error',
                }),
            ),
            Effect.runPromise,
        )
