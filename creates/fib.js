const { performance } = require('perf_hooks');

const wasm = require('../hello_wasm');

const fib = (n) => {
  if (n <= 1) {
    return n;
  }
  return fib(n - 1) + fib(n - 2);
};

const perform = async (z, bundle) => {
  const n = bundle.inputData.n;
  const runWith = bundle.inputData.run_with;
  const fibFunc = runWith === 'js' ? fib : wasm.fib;

  const start = performance.now();
  const result = fibFunc(n);
  const duration_ms = performance.now() - start;

  return {
    result,
    duration_ms,
  };
};

module.exports = {
  key: 'fib',
  noun: 'Fibonacci Number',

  display: {
    label: 'Compute Fibonacci Number',
    description: 'Computes the nth Fibonacci number.',
  },

  operation: {
    perform,
    inputFields: [
      {
        key: 'n',
        type: 'integer',
        label: 'Get the nth Fibonacci number, zero-based.',
        required: true,
      },
      {
        key: 'run_with',
        label: 'Run with',
        choices: {
          wasm: 'WebAssembly',
          js: 'JavaScript',
        },
        default: 'js',
        required: true,
      },
    ],
    sample: {
      result: 1,
      duration_ms: 1000,
    },
  },
};
