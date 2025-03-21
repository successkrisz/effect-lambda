import {
    APIGatewayProxyEvent as _APIGatewayProxyEvent,
    APIGatewayProxyResult,
} from 'aws-lambda'
import { Context, Effect, Schema, SchemaAST } from 'effect'
import { HandlerContext } from './common'
import { headerNormalizer } from './internal/headerNormalizer'
import { jsonBodyParser } from './internal/jsonBodyParser'
import { makeToHandler } from './makeToHandler'

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
)<APIGatewayProxyEvent, _APIGatewayProxyEvent>() {}

export const NormalizedAPIGatewayProxyEvent = APIGatewayProxyEvent.pipe(
    Effect.map(headerNormalizer),
)

export const NormalizedHeaders = APIGatewayProxyEvent.pipe(
    Effect.map((event) => event.headers),
)

/**
 * Utility to parse the body of an API Gateway event into a type.
 */
export const schemaBodyJson = <A, I, R extends never>(
    schema: Schema.Schema<A, I, R>,
    options?: SchemaAST.ParseOptions | undefined,
) =>
    NormalizedAPIGatewayProxyEvent.pipe(
        Effect.flatMap(jsonBodyParser),
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
    options?: SchemaAST.ParseOptions | undefined,
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
    options?: SchemaAST.ParseOptions | undefined,
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
export type HandlerEffect<R = never> = Effect.Effect<
    APIGatewayProxyResult,
    never,
    APIGatewayProxyEvent | HandlerContext | R
>

/**
 * Transform a HandlerEffect into an APIGatewayProxyHandler.
 *
 * @param effect HandlerEffect
 * @returns APIGatewayProxyHandler
 *
 * @example
 * ```typescript
 * import { toLambdaHandler } from 'effect-lambda/RestApi';
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

export const toLambdaHandler = makeToHandler(
    APIGatewayProxyEvent,
)<APIGatewayProxyResult>
