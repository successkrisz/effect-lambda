import { SNSEvent as _SNSEvent, SNSHandler } from 'aws-lambda'
import { Console, Context, Effect, Layer } from 'effect'
import { HandlerContext } from './common'

export class SNSEvent extends Context.Tag('@effect-lambda/SNSEvent')<
    SNSEvent,
    _SNSEvent
>() {}

export const SNSEventHandler =
    (
        effect: Effect.Effect<void, never, SNSEvent | HandlerContext>,
    ): SNSHandler =>
    async (event, context) =>
        effect.pipe(
            Effect.tapDefect(Console.error),
            Effect.provide(Layer.succeed(SNSEvent, event)),
            Effect.provide(Layer.succeed(HandlerContext, context)),
            Effect.runPromise,
        )
