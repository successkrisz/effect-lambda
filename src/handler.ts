import { Context as _Context } from 'aws-lambda'
import { Context } from 'effect'

export class HandlerContext extends Context.Tag(
    '@effect-lambda/HandlerContext',
)<HandlerContext, _Context>() {}
