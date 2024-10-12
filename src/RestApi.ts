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

/**
 * The API Gateway event with additional fields for raw headers and
 * raw body.
 *
 * The headers are normalized to lowercase.
 *
 * The body is
 * parsed as JSON if the content-type is application/json and
 * base64-decoded if isBase64Encoded is true.
 */
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

/**
 * Utility to parse the query parameters of an API Gateway event into a type.
 */
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

/**
 * Utility to access the path parameters of an API Gateway event into a type.
 *
 * @deprecated Use `schemaPathParams` instead.
 */
export const PathParameters = APIGatewayProxyEvent.pipe(
    Effect.map((x) => x.pathParameters || {}),
)

/**
 * Utility type can be useful when you are composing with
 * applyMiddleware for example.
 */
export type HandlerEffect = Effect.Effect<
    APIGatewayProxyResult,
    never,
    APIGatewayProxyEvent | HandlerContext
>

/**
 * Transform a HandlerEffect into an APIGatewayProxyHandler.
 *
 * @param effect HandlerEffect
 * @returns APIGatewayProxyHandler
 *
 * @example
 * ```typescript
 * import { toLambdaHandler } from './RestApi';
 * import { Effect } from 'effect';
 *
 * const handlerEffect = Effect.succeed({
 *   statusCode: 200,
 *   body: JSON.stringify({ message: "Hello, World!" }),
 * });
 *
 * export const handler = handlerEffect.pipe(toLambdaHandler);
 * ```
 */
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
