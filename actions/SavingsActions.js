var types = require('../constants/SavingsActionTypes');

var { getAreaGroups, getAreas } = require('./MapActions');
var savingsAPI = require('../api/savings');
var { nameToId, mapObject } = require('../helpers/common');

const confirmRemoveScenario = function(id) {
  return {
    type: types.SAVINGS_CONFIRM_REMOVE_SCENARIO,
    id
  };
}

const setSavingsScenarios = function(scenarios) {
  return {
    type: types.SAVINGS_SET_SCENARIOS,
    scenarios,
  };
};

const setSearchFilter = function(searchFilter) {
  return {
    type: types.SAVINGS_SET_QUERY,
    query: { name: searchFilter }
  };
}

const setQuery = function(query) {
  return {
    type: types.SAVINGS_SET_QUERY,
    query,
  };
};

const setAreas = function (areas) {
  return {
    type: types.SAVINGS_SET_AREAS,
    areas,
  };
};

const addSavingsScenario = function (values) {
  return function(dispatch, getState) {
    if (!values.title || !values.title.name) {
      throw 'Oops, no name provided to add budget scenario';
    }
    const title = values.title.name;
    
    const population = Array.isArray(values.population) ? values.population : [values.population];
    const spatial = Array.isArray(values.spatial) ? values.spatial.map(area => ({ type: 'AREA', areas: [area.area] })) : null;
    
    const parameters = {
      population,
      spatial,
      time: {
        ...values.time,
        start: values.time && values.time.start,
        end: values.time && values.time.end,
      },
    };

    const options = {
      title,
      parameters,
    };
    
    return savingsAPI.create(options)
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error('caught error in create savings scenario');
      throw error;
    });
  }
};

const removeSavingsScenario = function (scenarioKey) {
  return function(dispatch, getState) {
    const options = {
      scenarioKey,
    };
    
    return savingsAPI.remove(options)
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error('caught error in remove savings scenario');
      throw error;
    });
  }
};

const fetchSavings = function (query) {
  return function (dispatch, getState) {
    return savingsAPI.query({ query })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error('caught error in query savings scenarios', error);
    });
  };
};

const fetchCompleted = function () {
  return function (dispatch, getState) {
    const query = {
      sortBy: 'CREATED_ON',
      sortAscending: false,
      status: 'COMPLETED',
    };
    return dispatch(fetchSavings(query));
  };
};

const querySavingsScenarios = function() {
  return function (dispatch, getState) {
    return dispatch(fetchSavings(getState().savings.query))
    .then((res) => { 
      dispatch(setQuery({ total: res.total }));
      return res.scenarios || [];
    })
    .then(scenarios => dispatch(setSavingsScenarios(scenarios))); 
  };
};

const fetchAllAreas = function() {
  return function (dispatch, getState) {
    dispatch(getAreaGroups())
    .then(groups => Promise.all(groups.map(group => dispatch(getAreas(group.key))))
                            .then(areas => dispatch(setAreas(areas))));
  };
};

const setQueryAndFetch = function(query) {
  return function (dispatch, getState) {
    dispatch(setQuery(query));
    return dispatch(querySavingsScenarios());
  };
};

module.exports = {
  addSavingsScenario,
  removeSavingsScenario,
  confirmRemoveScenario,
  setSearchFilter,
  querySavingsScenarios,
  fetchCompleted,
  setQuery,
  setQueryAndFetch,
  fetchAllAreas,
};
