var types = require('../constants/SavingsActionTypes');


const addSavingsScenario = function (values) {
  return function(dispatch, getState) {
    const profile = getState().session.profile;
    const scenarios = getState().savings.scenarios;
    
    const lastId = scenarios[scenarios.length - 1] ? parseInt(scenarios[scenarios.length - 1].id) : -1;
    const id = parseInt(lastId) != null ? lastId+1 : -1;
    
    if (id == -1) {
      throw 'oops, cant get valid last savings scenario id!';
    }
    const user = profile.username;
    const now = new Date();
    const createdOn = now.valueOf();
    const completedOn = null;
    const potential = completedOn ?  Math.round(Math.random()*50) : null;

    const newScenario = {
      type: types.SAVINGS_ADD_SCENARIO,
      options: {
        name: values.name.label,
        id,
        user,
        parameters:values,
        createdOn,
        completedOn,
        potential
      }
    };
    dispatch(newScenario);
  }
};

const removeSavingsScenario = function(id) {
  return {
    type: types.SAVINGS_REMOVE_SCENARIO,
    id
  };
}

const confirmRemoveScenario = function(id) {
  return {
    type: types.SAVINGS_CONFIRM_REMOVE_SCENARIO,
    id
  };
}

const setSearchFilter = function(searchFilter) {
  return {
    type: types.SAVINGS_SET_SEARCH_FILTER,
    searchFilter
  };
}

module.exports = {
  addSavingsScenario,
  removeSavingsScenario,
  confirmRemoveScenario,
  setSearchFilter,
};
