var mirrorToPath = require('../helpers/path-mirror.js');

var types = mirrorToPath({

  BUDGET_ADD_SCENARIO: null,
  BUDGET_REMOVE_SCENARIO: null,
  BUDGET_UPDATE_SCENARIO: null,
  BUDGET_SET_ACTIVE: null,
  BUDGET_SET_INACTIVE: null,
  BUDGET_CONFIRM_REMOVE_SCENARIO: null,
  BUDGET_CONFIRM_SET: null,
  BUDGET_CONFIRM_RESET: null,
  BUDGET_SET_SEARCH_FILTER: null,

});

module.exports = types;
