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
import { RestApi } from "effect-lambda";
import { Effect } from "effect";
import { Schema } from "@effect/schema";

export const handler = RestApi.toLambdaHandler(
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
export const handler = RestApi.toLambdaHandler(
  RestApi.schemaPathParams(PathParamsSchema).pipe(
    Effect.map(({ name }) => name),
    Effect.bindTo("name"),
    Effect.bind("message", () =>
      RestApi.schemaBodyJson(PayloadSchema).pipe(Effect.map((x) => x.message)),
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
import { applyMiddleware, RestApi } from "effect-lambda";
import helmet from "helmet";
import { Effect, pipe } from "effect";

const toHandler = (effect: Parameters<typeof APIGProxyHandler>[0]) =>
  pipe(effect, Effect.map(applyMiddleware(helmet())), RestApi.toLambdaHandler);

export const handler = Effect.succeed({
  statusCode: 200,
  body: JSON.stringify({ message: "Hello, World!" }),
}).pipe(toHandler);
```

### SQS Trigger Handler

```typescript
import { SQSEvent, toLambdaHandler } from "effect-lambda/Sqs";
import { Effect } from "effect";
export const handler = toLambdaHandler(
  SQSEvent.pipe(
    Effect.map((event) => {
      // Do something with the event
    }),
  ),
);
```

### SNS Trigger Handler

```typescript
import { SNSEvent, toLambdaHandler } from "effect-lambda/Sns";
import { Effect } from "effect";
export const handler = toLambdaHandler(
  SQSEvent.pipe(
    Effect.map((event) => {
      // Do something with the event
    }),
  ),
);
```

### DynamoDB Stream Event Handler

```typescript
// handler.ts
import { toLambdaHandler } from "effect-lambda/DynamoDb";
import { Effect } from "effect";

export const handler = toLambdaHandler(
  Effect.map((event) => {
    event.Records.forEach((record) => {
      // Process each record
      console.log("DynamoDB Record: %j", record);
    });
  }),
);
```

This handler allows you to process DynamoDB stream events in a functional way using the `effect-lambda` library. You can access each record in the stream and apply your business logic accordingly.

## TODO list

Effect friendly wrapper for AWS Lambdas

- [x] APIGatewayProxyHandler - REST api or HTTP api with payload version 1
- [x] SQS Trigger
- [x] DynamoDB Trigger
- [x] Utility to deal with an array of records and produce a batchItemFailures response upon failures
- [x] Authorizer Trigger
- [x] SNS Trigger
- [x] Change API naming to use namespaces
- [ ] Add documentation
- [ ] Set up GitHub actions
- [ ] APIGatewayProxyHandlerV2 - HTTP api with payload version 2
- [ ] S3 Put Event Handler
- [ ] S3 Delete Event Handler
- [ ] SES Trigger
- [ ] EventBridge Trigger
