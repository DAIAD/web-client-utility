var types = require('../constants/BudgetActionTypes');
const budgetAPI = require('../api/budget');
var userAPI = require('../api/user');
var { fetchCompleted } = require('./SavingsActions');

var { extractFeatures, nameToId } = require('../helpers/common');

const setQuery = function(query) {
  return {
    type: types.BUDGET_SET_QUERY,
    query,
  };
};

const setBudgets = function (budgets) {
  return {
    type: types.BUDGET_SET_BUDGETS,
    budgets,
  };
};

const setSavingsScenarios = function(scenarios) {
  return {
    type: types.BUDGET_SET_SAVINGS_SCENARIOS,
    scenarios,
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

/*
const setExploreQuery = function(query) {
  return {
    type: types.BUDGET_EXPLORE_SET_QUERY,
    query
  };
}

const resetExploreQuery = function() {
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
*/

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

const fetchCompletedSavingsScenarios = function () {
  return function (dispatch, getState) {
    return dispatch(fetchCompleted())
    .then(res => dispatch(setSavingsScenarios(res.scenarios || [])));
  };
};

const addBudget = function (values) {
  return function(dispatch, getState) {

    if (!values.title || !values.title.name) {
      throw 'Oops, no name provided to add budget scenario';
    }
    const title = values.title.name;
    const utility = getState().config.utility.key;
    
    const population = Array.isArray(values.population) ? values.population : [{ type: 'UTILITY', key: utility }];
    const spatial = Array.isArray(values.spatial) ? values.spatial.map(area => ({ type: 'AREA', areas: [area.area] })) : null;

    const excludePopulation = Array.isArray(values.excludePopulation) ? values.excludePopulation : null;

    const excludeSpatial = Array.isArray(values.excludeSpatial) ? values.excludeSpatial.map(area => ({ type: 'AREA', areas: [area.area] })) : null;
    
    const parameters = {
      goal: values.goal && values.goal.goal || null,
      distribution: values.distribution && values.distribution.type || null,
      scenario: values.budgetType.type === 'SCENARIO' ? {
        key: values.scenario && values.scenario.key || null,
        percent: values.savings && values.savings.savings || null,
      } : null,
      include: {
        population,
        spatial,
      },
      exclude: {
        population: excludePopulation,
        spatial: excludeSpatial,
      },
    };

    const options = {
      title,
      parameters,
    };
    return budgetAPI.create(options)
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error('caught error in create budget');
      throw error;
    });
  }
};

const removeBudget = function (budgetKey) {
  return function(dispatch, getState) {
    const options = {
      budgetKey,
    };
    return budgetAPI.remove(options)
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error('caught error in remove budget');
      throw error;
    });
  };
};

const fetchBudget = function(budgetKey) {
  return function(dispatch, getState) {
    const options = {
      budgetKey,
    };
    return budgetAPI.find(options)
    .then((response) => {
      return response.scenario;
    })
    .catch((error) => {
      console.error('caught error in fetch budget');
      throw error;
    });
  }
};

const fetchBudgets = function (query) {
  return function (dispatch, getState) {
    return budgetAPI.query({ query })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error('caught error in query budgets', error);
    });
  };
};

const queryBudgets = function() {
  return function (dispatch, getState) {
    return dispatch(fetchBudgets(getState().budget.query))
    .then((res) => { 
      dispatch(setQuery({ total: res.total }));
      return res.budgets || [];
    })
    .then(budgets => dispatch(setBudgets(budgets))); 
  };
};

const setQueryAndFetch = function(query) {
  return function (dispatch, getState) {
    dispatch(setQuery(query));
    return dispatch(queryBudgets());
  };
};


const setActiveBudget = function(budgetKey) {
  return function(dispatch, getState) {
    const options = {
      budgetKey,
    };
    return budgetAPI.activate(options)
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error('caught error in activate budget');
      throw error;
    });
  }
};

const resetActiveBudget = function(budgetKey) {
  return function(dispatch, getState) {
    const options = {
      budgetKey,
    };
    return budgetAPI.deactivate(options)
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error('caught error in deactivate budget');
      throw error;
    });
  }
};

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
      console.error('error:', error);
      dispatch(setData(null, error));
    });
  };
}

module.exports = {
  fetchCompletedSavingsScenarios,
  queryBudgets,
  fetchBudget,
  //add
  addBudget,
  removeBudget,
  //common
  confirmRemoveBudgetScenario,
  //explore
  resetActiveBudget,
  setActiveBudget,
  confirmSetBudget,
  confirmResetBudget,
  setSearchFilter,
  /*
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
  */
  setQuery,
  setQueryAndFetch,
  requestExploreData,
};
