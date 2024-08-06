import {
    APIGatewayProxyEvent,
    APIGatewayProxyEventHeaders,
    APIGatewayProxyHandler,
    APIGatewayProxyResult,
} from 'aws-lambda'
import { Console, Context, Effect, Layer, Option, pipe } from 'effect'
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

export const PathParameters = APIGProxyEvent.pipe(
    Effect.map((x) => x.pathParameters),
    Effect.flatMap(Option.fromNullable),
)

export const APIGProxyHandler =
    (
        effect: Effect.Effect<
            APIGatewayProxyResult,
            never,
            never | APIGProxyEvent | HandlerContext
        >,
    ): APIGatewayProxyHandler =>
    async (event, context) =>
        effect.pipe(
            Effect.tapDefect(Console.error),
            Effect.catchAllDefect(() =>
                Effect.succeed({
                    statusCode: 500,
                    body: 'Internal Server Error',
                }),
            ),
            Effect.provide(
                Layer.effect(
                    APIGProxyEvent,
                    pipe(event, headerNormalizer, jsonBodyParser),
                ),
            ),
            Effect.provide(Layer.succeed(HandlerContext, context)),
            Effect.runPromise,
        )
