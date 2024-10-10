import {
    Context,
    DynamoDBStreamEvent as _DynamoDBStreamEvent,
} from 'aws-lambda'
import { Effect } from 'effect'
import event from './sampleEvents/ddbEvent.json'
import { HandlerContext } from '../src/common'
import {
    DynamoDBStreamEvent,
    DynamoDBStreamEventHandler,
    DynamoDBNewImages,
} from '../src/ddbHandler'

describe('ddbHandler', () => {
    it('should return void on a successful effect', async () => {
        const actual = await DynamoDBStreamEventHandler(Effect.void)(
            event as _DynamoDBStreamEvent,
            {} as Context,
            () => {},
        )
        expect(actual).toBe(undefined)
    })

    it('should reject if the effect dies', async () => {
        const actual = DynamoDBStreamEventHandler(Effect.die('error'))(
            event as _DynamoDBStreamEvent,
            {} as Context,
            () => {},
        )

        await expect(actual).rejects.toBeDefined()
    })

    it('effect should have access to the event', async () => {
        const actual = DynamoDBStreamEventHandler(
            DynamoDBStreamEvent.pipe(
                Effect.map((_event) => {
                    expect(_event).toEqual(event)
                }),
            ),
        )(event as _DynamoDBStreamEvent, {} as Context, () => {})

        await expect(actual).resolves.toBe(undefined)
    })

    it('effect should have access to the context', async () => {
        const context = { functionName: 'foobar' } as Context
        const actual = DynamoDBStreamEventHandler(
            HandlerContext.pipe(
                Effect.map((_context) => {
                    expect(_context).toEqual(context)
                }),
            ),
        )(event as _DynamoDBStreamEvent, context, () => {
            expect(context).toEqual(context)
        })

        await expect(actual).resolves.toBe(undefined)
    })

    it('should have access to the NewImages', async () => {
        const actual = DynamoDBStreamEventHandler(
            DynamoDBNewImages.pipe(
                Effect.map((newImages) => {
                    expect(newImages).toEqual(
                        event.Records.map((r) => r.dynamodb?.NewImage),
                    )
                }),
            ),
        )(event as _DynamoDBStreamEvent, {} as Context, () => {})

        await expect(actual).resolves.toBe(undefined)
    })
})
