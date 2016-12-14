var types = require('../constants/BudgetActionTypes');
var userAPI = require('../api/user');
var { extractFeatures, nameToId } = require('../helpers/common');


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

const setQuery = function(query) {
  return {
    type: types.BUDGET_EXPLORE_SET_QUERY,
    query
  };
}

const resetQuery = function() {
  return setQuery({
    cluster: 'none',
    group: 'all',
    geometry: null,
    index: 0,
    size: 10,
    serial: null,
    text: null,
  });
};

const setQueryCluster = function(cluster) {
  return setQuery({ cluster });
}

const setQueryGroup = function(group) {
  return setQuery({ group });
}

const resetQueryCluster = function() {
  return setQuery({ cluster: 'none' });
}

const resetQueryGroup = function() {
  return setQuery({ group: 'all' });
}

const setQueryGeometry = function(geometry) {
  return setQuery({ geometry });
}

const setQueryIndex = function(index) {
  return setQuery({ index });
}

const setQuerySize = function(size) {
  return setQuery({ size });
}

const setQuerySerial = function(serial) {
  return setQuery({ serial });
}

const setQueryText = function(text) {
  return setQuery({ text });
}

const requestData = function() {
  return {
    type: types.BUDGET_EXPLORE_REQUEST_DATA
  };
}

const setData = function(data, errors) {
  return {
    type: types.BUDGET_EXPLORE_SET_DATA,
    data,
    errors
  };
}

const requestExploreData = function() {
  return function(dispatch, getState) {
    dispatch(requestData());
    const { query } = getState().budget.explore;

    return userAPI.getAccounts(query).then(response => {
      if (Array.isArray(response.errors) && response.errors.length > 0) {
        dispatch(setData(response, response.errors));
      }
      //TODO: for now set a random number as budget for current budget
      const accounts = response.accounts.map(account => ({ 
        ...account, 
        budget: Math.round(Math.random()*100), 
        savings: Math.round(Math.random()*10) * (Math.random() < 0.5 ? -1 : 1) 
      }));

      dispatch(setData({ 
        total: response.total, 
        accounts,
        features: extractFeatures(accounts)
      }, null));
    },
    error => {
      console.log('error:', error);
      dispatch(setData(null, error));

    });
      
  };
}

module.exports = {
  //add
  addBudgetScenario,
  //common
  removeBudgetScenario,
  confirmRemoveBudgetScenario,
  //explore
  resetActiveBudget,
  setActiveBudget,
  confirmSetBudget,
  confirmResetBudget,
  setSearchFilter,
  setQueryIndex,
  setQuerySize,
  setQueryGroup,
  setQueryCluster,
  resetQueryGroup,
  resetQueryCluster,
  setQueryGeometry,
  setQuerySerial,
  setQueryText,
  setQuery,
  resetQuery,
  requestExploreData,
};
