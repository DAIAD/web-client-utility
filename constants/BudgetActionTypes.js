var mirrorToPath = require('../helpers/path-mirror.js');

var types = mirrorToPath({

  BUDGET_SET_QUERY: null,
  BUDGET_SET_BUDGETS: null,
  BUDGET_SET_ACTIVE_BUDGETS: null,
  BUDGET_SET_SAVINGS_SCENARIOS: null,
  BUDGET_CONFIRM_REMOVE_SCENARIO: null,
  BUDGET_CONFIRM_SET: null,
  BUDGET_CONFIRM_RESET: null,
  BUDGET_EXPLORE_SET_QUERY: null,
  BUDGET_EXPLORE_REQUEST_DATA: null,
  BUDGET_EXPLORE_SET_USER_DATA: null,
  BUDGET_EXPLORE_SET_CLUSTER_DATA: null,

});

module.exports = types;
