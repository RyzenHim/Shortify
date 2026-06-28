// Ensures TS knows about Jest globals in this repository.
// This is used by the test runner / editor TS when it doesn't pick up @types/jest.

import 'jest';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // keep empty; types come from @types/jest
  }
}
