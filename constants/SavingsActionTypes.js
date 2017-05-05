var mirrorToPath = require('../helpers/path-mirror.js');

var types = mirrorToPath({

  SAVINGS_ADD_SCENARIO: null,
  SAVINGS_REMOVE_SCENARIO: null,
  SAVINGS_UPDATE_SCENARIO: null,
  SAVINGS_CONFIRM_REMOVE_SCENARIO: null,
  SAVINGS_SET_QUERY: null,
  SAVINGS_SET_SCENARIOS: null,
  SAVINGS_SET_AREAS: null,

});

module.exports = types;
