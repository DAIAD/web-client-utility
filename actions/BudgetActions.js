var types = require('../constants/BudgetActionTypes');


const setValidationError  = function (error) {
  return {
    type: types.BUDGET_SET_VALIDATION_ERROR,
    error
  }
};

const addBudgetScenario = function (values) {
  return function(dispatch, getState) {
    const profile = getState().session.profile;
    const scenarios = getState().budget.scenarios;
    
    const lastId = scenarios[scenarios.length - 1] ? parseInt(scenarios[scenarios.length - 1].id) : -1;
    const id = parseInt(lastId) != null ? lastId+1 : -1;
    console.log('id:', id);
    if (id == -1) {
      throw 'oops, cant get valid last savings scenario id!';
    }
    const user = profile.username;
    const createdOn = new Date().valueOf();
    const completedOn = null;
    const parameters = values;
    const potential = completedOn ?  Math.round(Math.random()*50) : null;

    const newScenario = {
      type: types.BUDGET_ADD_SCENARIO,
      options: {
        name: values.name.label,
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
    id
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

const setAddBudgetWizardType = function(wizardType) {
  return {
    type: types.BUDGET_ADD_SET_WIZARD_TYPE,
    wizardType
  };
}

module.exports = {
  setValidationError,
  addBudgetScenario,
  removeBudgetScenario,
  setActiveBudget,
  resetActiveBudget,
  confirmRemoveBudgetScenario,
  confirmSetBudget,
  confirmResetBudget,
  setSearchFilter,
  setAddBudgetWizardType
};
