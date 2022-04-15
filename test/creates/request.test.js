/* globals describe, expect, test, it */

const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../../index');
const appTester = zapier.createAppTester(App);
// read the `.env` file into the environment, if available
zapier.tools.env.inject();

describe('creates.request', () => {
  it('make a request', async () => {
    const bundle = { inputData: { message: 'hello' } };
    const results = await appTester(
      App.creates.request.operation.perform,
      bundle
    );
    expect(results.parsed_content.json).toEqual({
      message: 'hello',
    });
  });
});
