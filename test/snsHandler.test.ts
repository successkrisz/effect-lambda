import { Context } from 'aws-lambda'
import { Effect } from 'effect'
import event from './sampleEvents/snsEvent.json'
import { HandlerContext } from '../src/common'
import { SNSEvent, SNSEventHandler } from '../src/snsHandler'

describe('snsHandler', () => {
    it('should return void on a successful effect', async () => {
        const actual = await SNSEventHandler(Effect.void)(
            event,
            {} as Context,
            () => {},
        )
        expect(actual).toBe(undefined)
    })

    it('should reject if the effect dies', async () => {
        const actual = SNSEventHandler(Effect.die('error'))(
            event,
            {} as Context,
            () => {},
        )

        await expect(actual).rejects.toBeDefined()
    })

    it('effect should have access to the event', async () => {
        const actual = SNSEventHandler(
            SNSEvent.pipe(
                Effect.map((_event) => {
                    expect(_event).toEqual(event)
                }),
            ),
        )(event, {} as Context, () => {})

        await expect(actual).resolves.toBe(undefined)
    })

    it('effect should have access to the context', async () => {
        const context = { functionName: 'foobar' } as Context
        const actual = SNSEventHandler(
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
})
