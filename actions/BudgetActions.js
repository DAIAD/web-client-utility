var types = require('../constants/BudgetActionTypes');
var { nameToId } = require('../helpers/common');

const addBudgetScenario = function (values) {
  return function(dispatch, getState) {
    const profile = getState().session.profile;
    const scenarios = getState().budget.scenarios;

    const name = values.name.label;

    if (!values.name || !values.name.label) {
      throw 'Oops, no name provided to add savings scenario';
    }

    const id = nameToId(name);

    if (scenarios.map(scenario => scenario.id).includes(id)) {
      throw `Oops, scenario with id ${id} already exists`;
    }

    const user = profile.username;
    const createdOn = new Date().valueOf();
    const completedOn = null;
    const parameters = values;
    const potential = completedOn ?  Math.round(Math.random()*50) : null;

    const newScenario = {
      type: types.BUDGET_ADD_SCENARIO,
      options: {
        name,
        id,
        user,
        parameters,
        createdOn,
        completedOn,
        potential
      }
    };
    dispatch(newScenario);
  }
};

const removeBudgetScenario = function(id) {
  return {
    type: types.BUDGET_REMOVE_SCENARIO,
    id
  };
};

const setActiveBudget = function(id) {
  return {
    type: types.BUDGET_SET_ACTIVE,
    id,
    date: new Date()
  };
};

const resetActiveBudget = function(id) {
  return {
    type: types.BUDGET_SET_INACTIVE,
    id
  };
};

const confirmRemoveBudgetScenario = function(id) {
  return {
    type: types.BUDGET_CONFIRM_REMOVE_SCENARIO,
    id
  };
}

const confirmSetBudget = function(id) {
  return {
    type: types.BUDGET_CONFIRM_SET,
    id
  };
}

const confirmResetBudget = function(id) {
  return {
    type: types.BUDGET_CONFIRM_RESET,
    id
  };
}

const setSearchFilter = function(searchFilter) {
  return {
    type: types.BUDGET_SET_SEARCH_FILTER,
    searchFilter
  };
}


module.exports = {
  addBudgetScenario,
  removeBudgetScenario,
  setActiveBudget,
  resetActiveBudget,
  confirmRemoveBudgetScenario,
  confirmSetBudget,
  confirmResetBudget,
  setSearchFilter,
};
