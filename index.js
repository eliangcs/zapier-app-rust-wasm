const createFib = require('./creates/fib');

const createRequest = require("./creates/request");

module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  triggers: {},
  searches: {},

  creates: {
    [createFib.key]: createFib,
    [createRequest.key]: createRequest
  },

  resources: {},
};
