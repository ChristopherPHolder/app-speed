import { Identity, SignInRequired } from '@app-speed/platform/identity';
import { Effect, Layer } from 'effect';

const accounts = new Map([
  ['e2e-admin', { id: 'user_admin', email: 'chris@example.com', name: 'Chris', imageUrl: '' }],
  ['e2e-member', { id: 'user_member', email: 'pat@example.com', name: 'Pat', imageUrl: '' }],
  ['e2e-outsider', { id: 'user_outsider', email: 'alex@example.com', name: 'Alex', imageUrl: '' }],
]);
// Fixed identities exist exclusively in the test API binary.
export const TestIdentityLive = Layer.succeed(Identity, {
  authenticate: (authorization) => {
    const account = accounts.get(authorization?.replace(/^Bearer /, '') ?? '');
    return account ? Effect.succeed(account) : Effect.fail(new SignInRequired({ message: 'Sign in required.' }));
  },
});
