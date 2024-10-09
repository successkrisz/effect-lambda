import {
    DynamoDBStreamEvent as _DynamoDBStreamEvent,
    DynamoDBStreamHandler,
} from 'aws-lambda'
import { Console, Context, Effect, Layer } from 'effect'
import { HandlerContext } from './handler'

// Define a context tag for DynamoDBStreamEvent
export class DynamoDBStreamEvent extends Context.Tag(
    '@effect-lambda/DynamoDBStreamEvent',
)<DynamoDBStreamEvent, _DynamoDBStreamEvent>() {}

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
            void,
            never,
            never | DynamoDBStreamEvent | HandlerContext
        >,
    ): DynamoDBStreamHandler =>
    async (event, context) =>
        effect.pipe(
            Effect.tapDefect(Console.error),
            Effect.provide(Layer.succeed(DynamoDBStreamEvent, event)),
            Effect.provide(Layer.succeed(HandlerContext, context)),
            Effect.runPromise,
        )
