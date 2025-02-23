import {
    SQSEvent as _SQSEvent,
    SQSRecord as _SQSRecord,
    SQSHandler,
} from 'aws-lambda'
import { Console, Context, Effect, Either, Layer } from 'effect'
import { BatchResponse, HandlerContext } from './common'

/**
 * Represents an SQS event in the context of AWS Lambda.
 * Extends the base SQSEvent from AWS Lambda types.
 *
 * @class
 * @extends {Context.Tag}
 */
export class SQSEvent extends Context.Tag('@effect-lambda/SQSEvent')<
    SQSEvent,
    _SQSEvent
>() {}

/**
 * Represents a single SQS record in the context of AWS Lambda.
 * Extends the base SQSRecord from AWS Lambda types.
 *
 * @class
 * @extends {Context.Tag}
 */
export class SQSRecord extends Context.Tag('@effect-lambda/SQSRecord')<
    SQSRecord,
    _SQSRecord
>() {}

/**
 * Extracts the message bodies from an SQS event.
 */
export const SQSMessageBodies = SQSEvent.pipe(
    Effect.map((event) => event.Records.map((record) => record.body)),
)

/**
 * Transform an effect into an SQSHandler.
 *
 * @param effect Effect.Effect<void, never, SQSEvent | HandlerContext>
 * @returns SNSHandler
 *
 * @example
 * ```typescript
 * import { SQSEvent, toLambdaHandler } from '@effect-lambda/Sqs'
 * import { Effect, Console } from 'effect'
 *
 * // Define an effect that processes each message in the SQS event
 * const processSQSMessages = SQSEvent.pipe(
 *   Effect.map((event) => event.Records),
 *   Effect.tap((records) =>
 *     Effect.forEach(records, (record) =>
 *       Console.log(`Processing message: ${record.body}`)
 *     )
 *   )
 * )
 *
 * // Convert the effect into a Lambda handler
 * export const handler = processSQSMessages.pipe(toLambdaHandler)
 * ```
 */
export const toLambdaHandler =
    (
        effect: Effect.Effect<
            void | BatchResponse,
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
    effect: Effect.Effect<void, E, SQSRecord | SQSEvent | HandlerContext>,
): Effect.Effect<BatchResponse | undefined, never, SQSEvent | HandlerContext> =>
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
