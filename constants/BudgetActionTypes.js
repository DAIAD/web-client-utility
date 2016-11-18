var mirrorToPath = require('../helpers/path-mirror.js');

var types = mirrorToPath({

  BUDGET_SET_VALIDATION_ERROR: null,
  BUDGET_ADD_SCENARIO: null,
  BUDGET_REMOVE_SCENARIO: null,
  BUDGET_UPDATE_SCENARIO: null,
  BUDGET_SET_ACTIVE: null,
  BUDGET_SET_INACTIVE: null,
  BUDGET_CONFIRM_REMOVE_SCENARIO: null,
  BUDGET_CONFIRM_SET: null,
  BUDGET_CONFIRM_RESET: null,
  BUDGET_ADD_SET_WIZARD_TYPE: null,
  BUDGET_SET_SEARCH_FILTER: null,

});

module.exports = types;
