import { APIGatewayProxyEvent } from 'aws-lambda'
import { Effect, Schema as s, ParseResult } from 'effect'

export const jsonBodyParser = <T extends APIGatewayProxyEvent>(
    event: T,
): Effect.Effect<T & { rawBody?: T['body'] }, ParseResult.ParseError> => {
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
