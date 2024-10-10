import {
    SQSEvent as _SQSEvent,
    SQSRecord as _SQSRecord,
    SQSBatchResponse,
    SQSHandler,
} from 'aws-lambda'
import { Console, Context, Effect, Either, Layer } from 'effect'
import { BatchResponse, HandlerContext } from './common'

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
            SQSEvent | HandlerContext
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

/**
 * recordProcessorAdapter - adapts a single record processor effect to a batch processor effect
 *
 * you can control the concurrency of the batch processing by setting the concurrency outside
 * of this function, with the default being `unbounded`.
 *
 * @param effect Effect.Effect<void, E, SQSRecord> - an effect handling a single SQS record
 * @returns A handler effect compatible with SQSEventHandler
 *
 * @example
 * ```typescript
 * import { Console, Effect, Either } from 'effect';
 * import { SQSRecord, SQSEventHandler, recordProcessorAdapter } from '@effect-lambda';
 * // Define an effect that processes a single SQS record
 * const processRecord = SQSRecord.pipe(
 *     Effect.tap((record) => Console.log(record.body))
 * );
 *
 * // Adapt the single record processor effect to handle a batch of records and use it with an SQSEventHandler
 * export const handler = processRecord.pipe(
 *    recordProcessorAdapter,
 *    Effect.withConcurrency(1), // optional if want sequential processing
 *    SQSEventHandler,
 * );
 * ```
 */
export const recordProcessorAdapter = <E>(
    effect: Effect.Effect<void, E, SQSRecord>,
): Effect.Effect<BatchResponse | undefined, never, SQSEvent> =>
    Effect.gen(function* () {
        const { Records } = yield* SQSEvent

        const effects = Records.map((record) =>
                effect.pipe(Effect.provideService(SQSRecord, record)),
            ),
            results = yield* Effect.all(effects, {
                concurrency: 'inherit',
                mode: 'either',
            })

        return {
            batchItemFailures: results
                .map((eff, i) => [eff, Records[i].messageId] as const)
                .filter(([eff]) => Either.isLeft(eff))
                .map(([_, id]) => ({ itemIdentifier: id })),
        }
    })
