const wasm = require('../hello_wasm');

const perform = async (z, bundle) => {
  const response = await wasm.perform_request(z, bundle);
  return response;
};

module.exports = {
  key: 'request',
  noun: 'Request',

  display: {
    label: 'Create Request',
    description:
      'Creates a new request, probably with input from previous steps.',
  },

  operation: {
    perform,

    inputFields: [{ key: 'message', required: true }],
    sample: {
      status: 200,
      content: '{}',
    },
  },
};
