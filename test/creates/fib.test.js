/* globals describe, expect, test, it */

const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../../index');
const appTester = zapier.createAppTester(App);
// read the `.env` file into the environment, if available
zapier.tools.env.inject();

describe('creates.fib', () => {
  it('compute fib(10) with js', async () => {
    const bundle = { inputData: { n: 10, run_with: 'js' } };
    const results = await appTester(App.creates.fib.operation.perform, bundle);
    expect(results.result).toEqual(55);
  });

  it('compute fib(10) with wasm', async () => {
    const bundle = { inputData: { n: 10, run_with: 'wasm' } };
    const results = await appTester(App.creates.fib.operation.perform, bundle);
    expect(results.result).toEqual(55);
  });
});
