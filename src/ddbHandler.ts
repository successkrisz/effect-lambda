import {
    DynamoDBStreamEvent as _DynamoDBStreamEvent,
    DynamoDBRecord as _DynamoDBRecord,
    DynamoDBStreamHandler,
} from 'aws-lambda'
import { Console, Context, Effect, Layer } from 'effect'
import { BatchResponse, HandlerContext } from './common'

// Define a context tag for DynamoDBStreamEvent
export class DynamoDBStreamEvent extends Context.Tag(
    '@effect-lambda/DynamoDBStreamEvent',
)<DynamoDBStreamEvent, _DynamoDBStreamEvent>() {}

export class DynamoDBRecord extends Context.Tag(
    '@effect-lambda/DynamoDBRecord',
)<DynamoDBStreamEvent, _DynamoDBRecord>() {}

// Utility to extract the new images from the DynamoDB stream event
export const DynamoDBNewImages = DynamoDBStreamEvent.pipe(
    Effect.map((event) =>
        event.Records.map((record) => record.dynamodb?.NewImage),
    ),
)

// Define the DynamoDBStreamEventHandler
export const DynamoDBStreamEventHandler =
    (
        effect: Effect.Effect<
            void | BatchResponse,
            never,
            DynamoDBStreamEvent | HandlerContext
        >,
    ): DynamoDBStreamHandler =>
    async (event, context) =>
        effect.pipe(
            Effect.tapDefect(Console.error),
            Effect.provide(Layer.succeed(DynamoDBStreamEvent, event)),
            Effect.provide(Layer.succeed(HandlerContext, context)),
            Effect.runPromise,
        )
