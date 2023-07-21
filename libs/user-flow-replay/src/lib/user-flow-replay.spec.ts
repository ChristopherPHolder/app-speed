import { describe, it, expect } from 'vitest';
import { userFlowReplay } from './user-flow-replay';

describe('userFlowReplay', () => {
  it('should work', () => {
    expect(userFlowReplay()).toEqual('user-flow-replay');
  });
});
