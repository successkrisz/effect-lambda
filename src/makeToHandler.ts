import { Handler } from 'aws-lambda'
import { ConfigError, Context, Effect, Layer } from 'effect'
import { HandlerContext } from './common'

/**
 * Factory for creating toLambdaHandler functions.
 *
 * @param eventTag - The event tag to use for the handler.
 * @returns A toLambdaHandler function.
 *
 * @example
 * ```typescript
 * import { makeToHandler } from '@effect-lambda/lambda'
 *
 * class Event extends Context.Tag('@foobar/some-event')<Event, number>() {}
 *
 * const toFooHandler = makeToHandler(Event)<{ foo: number }>
 *
 * const handlerEffect = Effect.map(Event, e => ({ foo: e }))
 *
 * const handler = toFooHandler(handlerEffect)
 * ```
 */
export function makeToHandler<T extends Context.Tag<any, any>>(eventTag: T) {
    return <A = never>(
            effect: Effect.Effect<
                NoInfer<A>,
                typeof ConfigError,
                Context.Tag.Identifier<T> | HandlerContext
            > &
                ([A] extends [never] ? never : unknown),
        ): Handler<Context.Tag.Service<T>, A> =>
        (event, context) =>
            effect.pipe(
                Effect.tapDefect(Effect.logError),
                Effect.provide(
                    Layer.mergeAll(
                        Layer.sync(eventTag, () => event),
                        Layer.sync(HandlerContext, () => context),
                    ),
                ),
                Effect.runPromise,
            )
}
