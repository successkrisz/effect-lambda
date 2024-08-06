import { Context } from 'aws-lambda'
import { Effect } from 'effect'
import event from './sampleEvents/sqsEvent.json'
import { HandlerContext } from '../src/handler'
import { SQSEvent, SQSEventHandler, SQSMessageBodies } from '../src/sqsHandler'

describe('sqsHandler', () => {
    it('should return void on an successful effect', async () => {
        const actual = await SQSEventHandler(Effect.void)(
            event,
            {} as Context,
            () => {},
        )
        expect(actual).toBe(undefined)
    })

    it('should reject if the effect dies', async () => {
        const actual = SQSEventHandler(Effect.die('error'))(
            event,
            {} as Context,
            () => {},
        )

        await expect(actual).rejects.toBeDefined()
    })

    it('effect should have access to the event', async () => {
        const actual = SQSEventHandler(
            SQSEvent.pipe(
                Effect.map((_event) => {
                    expect(_event).toEqual(event)
                }),
            ),
        )(event, {} as Context, () => {})

        await expect(actual).resolves.toBe(undefined)
    })

    it('effect should have access to the context', async () => {
        const context = { functionName: 'foobar' } as Context
        const actual = SQSEventHandler(
            HandlerContext.pipe(
                Effect.map((_context) => {
                    expect(_context).toEqual(context)
                }),
            ),
        )(event, context, () => {
            expect(context).toEqual(context)
        })

        await expect(actual).resolves.toBe(undefined)
    })

    it('should have access to the MessageBodies', async () => {
        const actual = SQSEventHandler(
            SQSMessageBodies.pipe(
                Effect.map((messageBodies) => {
                    expect(messageBodies).toEqual(
                        event.Records.map((r) => r.body),
                    )
                }),
            ),
        )(event, {} as Context, () => {})

        await expect(actual).resolves.toBe(undefined)
    })
})
