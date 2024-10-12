import { SNSEvent as _SNSEvent, SNSHandler } from 'aws-lambda'
import { Console, Context, Effect, Layer } from 'effect'
import { HandlerContext } from './common'

export class SNSEvent extends Context.Tag('@effect-lambda/SNSEvent')<
    SNSEvent,
    _SNSEvent
>() {}

/**
 * Transform an effect into an SNSHandler.
 *
 * @param effect Effect.Effect<void, never, SNSEvent | HandlerContext>
 * @returns SNSHandler
 *
 * @example
 * ```typescript
 * import { Console, Effect } from 'effect'
 * import { toLambdaHandler } from '@effect-lambda/Sns'
 *
 * export const handler = toLambdaHandler(
 *    Effect.void.pipe(
 *       Effect.tap(() => Console.log('Hello, World!'))
 *   )
 * )
 */
export const toLambdaHandler =
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
