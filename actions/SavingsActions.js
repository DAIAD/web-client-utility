var types = require('../constants/SavingsActionTypes');
var { nameToId } = require('../helpers/common');


const addSavingsScenario = function (values) {
  return function(dispatch, getState) {
    const profile = getState().session.profile;
    const scenarios = getState().savings.scenarios;
    
    if (!values.name || !values.name.label) {
      throw 'Oops, no name provided to add budget scenario';
    }
    const name = values.name.label;
    const id = nameToId(name);   

    if (scenarios.map(scenario => scenario.id).includes(id)) {
      throw `Oops, budget scenario with id ${id} already exists`;
    }

    const user = profile.username;
    const now = new Date();
    const createdOn = now.valueOf();
    const completedOn = null;
    const potential = completedOn ?  Math.round(Math.random()*50) : null;

    const newScenario = {
      type: types.SAVINGS_ADD_SCENARIO,
      options: {
        name,
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
