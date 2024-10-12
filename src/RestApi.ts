import { Schema } from '@effect/schema'
import { ParseOptions } from '@effect/schema/AST'
import {
    APIGatewayProxyEvent as _APIGatewayProxyEvent,
    APIGatewayProxyEventHeaders,
    APIGatewayProxyHandler,
    APIGatewayProxyResult,
} from 'aws-lambda'
import { Console, Context, Effect, Layer, pipe } from 'effect'
import { HandlerContext } from './common'
import { headerNormalizer } from './internal/headerNormalizer'
import { jsonBodyParser } from './internal/jsonBodyParser'

export class APIGatewayProxyEvent extends Context.Tag(
    '@effect-lambda/APIGatewayProxyEvent',
)<
    APIGatewayProxyEvent,
    _APIGatewayProxyEvent & {
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
    APIGatewayProxyEvent.pipe(
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
    APIGatewayProxyEvent.pipe(
        Effect.map(({ pathParameters }) => pathParameters || {}),
        Effect.flatMap((pathParameters) =>
            Schema.decodeUnknownEither(schema, options)(pathParameters),
        ),
    )

export const schemaQueryParams = <A, I, R extends never>(
    schema: Schema.Schema<A, I, R>,
    options?: ParseOptions | undefined,
) =>
    APIGatewayProxyEvent.pipe(
        Effect.map(({ queryStringParameters }) => queryStringParameters || {}),
        Effect.flatMap((queryStringParameters) =>
            Schema.decodeUnknownEither(schema, options)(queryStringParameters),
        ),
    )

export const PathParameters = APIGatewayProxyEvent.pipe(
    Effect.map((x) => x.pathParameters || {}),
)

export type HandlerEffect = Effect.Effect<
    APIGatewayProxyResult,
    never,
    APIGatewayProxyEvent | HandlerContext
>

export const toLambdaHandler =
    (effect: HandlerEffect): APIGatewayProxyHandler =>
    async (event, context) =>
        effect.pipe(
            Effect.provide(
                Layer.effect(
                    APIGatewayProxyEvent,
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
