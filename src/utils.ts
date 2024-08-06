import { Effect } from 'effect'

/**
 * Runs an array of effects in parallel with unbounded concurrency.
 *
 * @template T - The type of the value that the effect produces.
 * @template E - The type of the error that the effect may produce.
 * @param {Array<Effect.Effect<T, E>>} effects - An array of effects to run in parallel.
 * @returns {Effect.Effect<Either<T, E>>} A single effect that represents the result of running all the effects in parallel.
 */
export const runPar = <T, E = never>(effects: Array<Effect.Effect<T, E>>) =>
    Effect.all(effects, { concurrency: 'unbounded', mode: 'either' })
