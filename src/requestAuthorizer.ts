import {
    APIGatewayAuthorizerHandler,
    APIGatewayAuthorizerResult,
    APIGatewayAuthorizerEvent as _APIGatewayAuthorizerEvent,
} from 'aws-lambda'
import { Effect, pipe, Context, Layer, Data } from 'effect'
import { HandlerContext } from './common'

export class APIGatewayAuthorizerEvent extends Context.Tag(
    '@effect-lambda/APIGatewayAuthorizerEvent',
)<APIGatewayAuthorizerEvent, _APIGatewayAuthorizerEvent>() {}

export class UnauthorizedError extends Data.TaggedError(
    '@effect-lambda/UnauthorizedError',
)<{}> {}

export const CustomAuthorizerHandler =
    (
        effect: Effect.Effect<
            APIGatewayAuthorizerResult,
            UnauthorizedError,
            APIGatewayAuthorizerEvent | HandlerContext
        >,
    ): APIGatewayAuthorizerHandler =>
    (event, context) =>
        pipe(
            effect,
            Effect.provide(Layer.succeed(APIGatewayAuthorizerEvent, event)),
            Effect.provide(Layer.succeed(HandlerContext, context)),
            Effect.runPromise,
        )
