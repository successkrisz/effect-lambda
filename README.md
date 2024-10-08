# effect-lambda

![NPM Version](https://img.shields.io/npm/v/effect-lambda)

Effect runtime for AWS Lambdas

## Installation

```bash
pnpm add effect-lambda effect @effect/schema
```

## Usage

```typescript
// handler.ts
import { APIGProxyHandler } from 'effect-lambda'
import { Effect } from 'effect'
import { Schema } from '@effect/schema'

export const handler = APIGProxyHandler(
    Effect.succeed({
        statusCode: 200,
        body: JSON.stringify({ message: 'Hello, World!' }),
    })
)

// Or access the payload and path parameters from the event
const PayloadSchema = Schema.Struct({
    message: Schema.String,
})
const PathParamsSchema = Schema.Struct({
    name: Schema.String,
})
export const handler = APIGProxyHandler(
    schemaPathParams(PathParamsSchema).pipe(
        Effect.map(({ name }) => name),
        Effect.bindTo('name'),
        Effect.bind('message', () =>
            schemaBodyJson(PayloadSchema).pipe(
                Effect.map((x) => x.message),
            ),
        ),
        Effect.map(({ name, message }) => ({
            statusCode: 200,
            body: `Hello ${name}, ${message}`,
        })),
        Effect.catchTag('ParseError', () =>
            Effect.succeed({
                statusCode: 400,
                body: 'Invalid JSON',
            }),
        ),
    ),
)
```

```json
```

Effect friendly wrapper for AWS Lambdas

- [x]: `APIGatewayProxyHandler` - REST api or HTTP api with payload version 1
- [ ]: `APIGatewayProxyHandlerV2` - HTTP api with payload version 2
- [ ]: `Authorizer Trigger`
- [ ]: `SNS Trigger`
- [x]: `SQS Trigger`
- [ ]: `DynamoDB Trigger`
