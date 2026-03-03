import { Data } from 'effect';

export class Ec2SsmCycleError extends Data.TaggedError('Ec2SsmCycleError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

