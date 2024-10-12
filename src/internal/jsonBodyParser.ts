import { ParseError } from '@effect/schema/ParseResult'
import * as s from '@effect/schema/Schema'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { Effect } from 'effect'

export const jsonBodyParser = <T extends APIGatewayProxyEvent>(
    event: T,
): Effect.Effect<T & { rawBody?: T['body'] }, ParseError> => {
    if (
        event.body !== null &&
        event.headers['content-type'] === 'application/json'
    ) {
        const { body } = event
        return Effect.if({
            onTrue: () =>
                Effect.succeed(Buffer.from(body, 'base64').toString()),
            onFalse: () => Effect.succeed(body),
        })(event.isBase64Encoded).pipe(
            Effect.flatMap(s.decodeEither(s.parseJson(s.Unknown))),
            Effect.map((jsonBody) => ({
                ...event,
                body: jsonBody,
                rawBody: body,
            })),
        )
    }

    return Effect.succeed(event)
}
