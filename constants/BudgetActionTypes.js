var mirrorToPath = require('../helpers/path-mirror.js');

var types = mirrorToPath({

  BUDGET_SET_QUERY: null,
  BUDGET_SET_BUDGETS: null,
  BUDGET_SET_SAVINGS_SCENARIOS: null,
  BUDGET_ADD_SCENARIO: null,
  BUDGET_REMOVE_SCENARIO: null,
  BUDGET_UPDATE_SCENARIO: null,
  BUDGET_SET_ACTIVE: null,
  BUDGET_SET_INACTIVE: null,
  BUDGET_CONFIRM_REMOVE_SCENARIO: null,
  BUDGET_CONFIRM_SET: null,
  BUDGET_CONFIRM_RESET: null,
  BUDGET_SET_SEARCH_FILTER: null,

  BUDGET_EXPLORE_SET_QUERY: null,
  BUDGET_EXPLORE_REQUEST_DATA: null,
  BUDGET_EXPLORE_SET_DATA: null,

});

module.exports = types;
