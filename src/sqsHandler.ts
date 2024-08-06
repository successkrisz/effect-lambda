import {
    SQSEvent as _SQSEvent,
    SQSRecord as _SQSRecord,
    SQSBatchResponse,
    SQSHandler,
} from 'aws-lambda'
import { Console, Context, Effect, Either, Layer } from 'effect'
import { HandlerContext } from './handler'

export class SQSEvent extends Context.Tag('@effect-lambda/SQSEvent')<
    SQSEvent,
    _SQSEvent
>() {}

export class SQSRecord extends Context.Tag('@effect-lambda/SQSRecord')<
    SQSRecord,
    _SQSRecord
>() {}

export const SQSMessageBodies = SQSEvent.pipe(
    Effect.map((event) => event.Records.map((record) => record.body)),
)

export const SQSEventHandler =
    (
        effect: Effect.Effect<
            void | SQSBatchResponse,
            never,
            never | SQSEvent | HandlerContext
        >,
    ): SQSHandler =>
    async (event, context) =>
        effect.pipe(
            Effect.tapDefect(Console.error),
            Effect.provide(Layer.succeed(SQSEvent, event)),
            Effect.provide(Layer.succeed(HandlerContext, context)),
            Effect.runPromise,
        )

export const SQSEventRecordHandler =
    (_: Effect.Effect<void, never, SQSRecord | HandlerContext>): SQSHandler =>
    () =>
        Promise.reject('Not Implemented yet')

export const sqsBatchResponse =
    (event: _SQSEvent) =>
    (response: Either.Either<any, any>[]): SQSBatchResponse => ({
        batchItemFailures: response
            .map((eff, i) => [eff, event.Records[i].messageId] as const)
            .filter(([eff]) => Either.isLeft(eff))
            .map(([_, id]) => ({ itemIdentifier: id })),
    })
