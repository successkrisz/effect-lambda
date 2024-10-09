# effect-lambda

[![NPM Version](https://img.shields.io/npm/v/effect-lambda)](https://www.npmjs.com/package/effect-lambda)

Effect friendly wrapper for AWS Lambda functions.

## Installation

This library has peer dependencies on `@effect/schema` and `effect`. You can install them via npm or pnpm or any other package manager you prefer.

```bash
# pnpm
pnpm add effect-lambda effect @effect/schema
# npm
npm install effect-lambda effect @effect/schema
```

## Usage

### API Gateway Proxy Handler

```typescript
// handler.ts
import { APIGProxyHandler } from "effect-lambda";
import { Effect } from "effect";
import { Schema } from "@effect/schema";

export const handler = APIGProxyHandler(
  Effect.succeed({
    statusCode: 200,
    body: JSON.stringify({ message: "Hello, World!" }),
  }),
);

// Or access the payload and path parameters from the event
const PayloadSchema = Schema.Struct({
  message: Schema.String,
});
const PathParamsSchema = Schema.Struct({
  name: Schema.String,
});
export const handler = APIGProxyHandler(
  schemaPathParams(PathParamsSchema).pipe(
    Effect.map(({ name }) => name),
    Effect.bindTo("name"),
    Effect.bind("message", () =>
      schemaBodyJson(PayloadSchema).pipe(Effect.map((x) => x.message)),
    ),
    Effect.map(({ name, message }) => ({
      statusCode: 200,
      body: `Hello ${name}, ${message}`,
    })),
    Effect.catchTag("ParseError", () =>
      Effect.succeed({
        statusCode: 400,
        body: "Invalid JSON",
      }),
    ),
  ),
);
```

You can use [helmet](https://www.npmjs.com/package/helmet) to secure your application using the provided applyMiddleware utility.

```typescript
import { applyMiddleware, APIGProxyHandler } from "effect-lambda";
import helmet from "helmet";
import { Effect, pipe } from "effect";

const toHandler = (effect: Parameters<typeof APIGProxyHandler>[0]) =>
  pipe(effect, Effect.map(applyMiddleware(helmet())), APIGProxyHandler);

export const handler = Effect.succeed({
  statusCode: 200,
  body: JSON.stringify({ message: "Hello, World!" }),
}).pipe(toHandler);
```

### SQS Trigger Handler

```typescript
export const handler = SQSEventHandler(
  SQSEvent.pipe(
    Effect.map((event) => {
      // Do something with the event
    }),
  ),
);
```

Effect friendly wrapper for AWS Lambdas

- [x]: `APIGatewayProxyHandler` - REST api or HTTP api with payload version 1
- [ ]: `APIGatewayProxyHandlerV2` - HTTP api with payload version 2
- [ ]: `Authorizer Trigger`
- [ ]: `SNS Trigger`
- [x]: `SQS Trigger`
- [ ]: `DynamoDB Trigger`
