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

const setActiveBudgets = function (budgets) {
  return {
    type: types.BUDGET_SET_ACTIVE_BUDGETS,
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

const setExploreQuery = function(query) {
  return {
    type: types.BUDGET_EXPLORE_SET_QUERY,
    query
  };
}

const resetExploreQuery = function() {
  return setExploreQuery({
    //cluster: 'none',
    //group: 'all',
    geometry: null,
    index: 0,
    size: 10,
    serial: '',
    text: '',
  });
};

const requestData = function() {
  return {
    type: types.BUDGET_EXPLORE_REQUEST_DATA
  };
}

const setUserData = function(data, errors) {
  return {
    type: types.BUDGET_EXPLORE_SET_USER_DATA,
    data,
    errors
  };
}
const setClusterData = function(data) {
  return {
    type: types.BUDGET_EXPLORE_SET_CLUSTER_DATA,
    data,
  };
};

const fetchCompletedSavingsScenarios = function () {
  return function (dispatch, getState) {
    return dispatch(fetchCompleted())
    .then(res => dispatch(setSavingsScenarios(res.scenarios || [])));
  };
};

const addBudget = function (values) {
  return function(dispatch, getState) {
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
    }
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

const queryBudgets = function (query) {
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

const fetchBudgets = function() {
  return function (dispatch, getState) {
    return dispatch(queryBudgets(getState().budget.query))
    .then((res) => { 
      dispatch(setQuery({ total: res.total }));
      return res.budgets || [];
    })
    .then(budgets => dispatch(setBudgets(budgets))); 
  };
};

const fetchActiveBudgets = function () {
  return function (dispatch, getState) {
    return dispatch(queryBudgets({
      pageIndex: 0,
      pageSize: 20,
      //active: true,
    }))
    .then((res) => {
      dispatch(setActiveBudgets(res.budgets.filter(b => b.active) || []));
    });
  };
};

const setQueryAndFetch = function(query) {
  return function (dispatch, getState) {
    dispatch(setQuery(query));
    return dispatch(fetchBudgets());
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
      if (!response || !response.success) {
        throwServerError(response);
      }
      return response;
    })
    .catch((error) => {
      console.error('caught error in deactivate budget', error);
      throw error;
    });
  }
};

const exploreBudgetCluster = function (budgetKey, clusterKey) {
  return function(dispatch, getState) {
    const options = {
      budgetKey,
      clusterKey,
    };
    
    return budgetAPI.exploreCluster(options)
    .then((response) => {
      if (!response || !response.success) {
        throwServerError(response);
      }
      return response;
    })
    .catch((error) => {
      console.error('caught error in explore budget cluster', error);
      return null;
      //throw error;
    });
  }
};

const exploreBudgetAllClusters = function (budgetKey) {
  return function (dispatch, getState) {
    const { clusters = [] } = getState().config.utility;
    return Promise.all(clusters.map(cluster => dispatch(exploreBudgetCluster(budgetKey, cluster.key))));
  };
};

const exploreBudgetUser = function (budgetKey, consumerKey) {
  return function(dispatch, getState) {
    const options = {
      budgetKey,
      consumerKey,
    };
    
    return budgetAPI.exploreConsumer(options)
    .then((response) => {
      if (!response || !response.success) {
        throwServerError(response);
      }
      return response;
    })
    .catch((error) => {
      console.error('caught error in explore budget consumer', error);
      throw error;
    });
  }
};

const exploreBudgetAllUsers = function (budgetKey, query) {
  return function (dispatch, getState) {
    return userAPI.getAccounts(query)
    .then((userData) => {
    return Promise.all(userData.accounts.map((account) => {
      return dispatch(exploreBudgetUser(budgetKey, account.id) )
      .then(data => ({
        ...account,
        ...data,
      }));
    }))
      .then(allUserData => ({ 
        total: userData.total,
        accounts: allUserData,
      }));
    })
  };
};

const requestExploreData = function(budgetKey) {
  return function(dispatch, getState) {
    dispatch(requestData());
    const { query } = getState().budget.explore;

    return Promise.all([
      dispatch(exploreBudgetAllUsers(budgetKey, query)),
      dispatch(exploreBudgetAllClusters(budgetKey)),
    ])
    .then(([userData, clusterData]) => {
      dispatch(setClusterData(clusterData.filter(c => c != null)));

     dispatch(setUserData({
      total: userData.total,
      accounts: userData.accounts,
      features: extractFeatures(userData.accounts),
    }, null));
    },
    (error) => {
      console.error('caught error in request explore data', error);
      dispatch(setUserData({}, error));
    });
  };
}

module.exports = {
  fetchCompletedSavingsScenarios,
  fetchBudgets,
  fetchActiveBudgets,
  fetchBudget,
  addBudget,
  removeBudget,
  confirmRemoveBudgetScenario,
  resetActiveBudget,
  setActiveBudget,
  confirmSetBudget,
  confirmResetBudget,
  setSearchFilter,
  setQuery,
  setQueryAndFetch,
  requestExploreData,
  setExploreQuery,
  resetExploreQuery,
};
