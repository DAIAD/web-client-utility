var types = require('../constants/SavingsActionTypes');

var { getAreaGroups, getAreas } = require('./MapActions');
var savingsAPI = require('../api/savings');
var { throwServerError, sortSegments } = require('../helpers/common');

const confirmRemoveScenario = function (id) {
  return {
    type: types.SAVINGS_CONFIRM_REMOVE_SCENARIO,
    id
  };
}

const setSavingsScenarios = function (scenarios) {
  return {
    type: types.SAVINGS_SET_SCENARIOS,
    scenarios,
  };
};

const setSearchFilter = function (searchFilter) {
  return {
    type: types.SAVINGS_SET_QUERY,
    query: { name: searchFilter }
  };
}

const setQuery = function (query) {
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

const setExploreScenario = function (scenario) {
  return {
    type: types.SAVINGS_SET_EXPLORE_SCENARIO,
    scenario,
  };
};

const setExploreData = function (data) {
  return {
    type: types.SAVINGS_SET_EXPLORE_DATA,
    data,
  };
};

const addSavingsScenario = function (values) {
  return function (dispatch, getState) {
    const title = values.title.name;

    const population = Array.isArray(values.population) ? values.population : [values.population];
    const spatial = Array.isArray(values.spatial) ? values.spatial.map(area => ({ type: 'AREA', areas: [area.area] })) : null;

    const parameters = {
      population: population.map(p => ({ key: p.key, type: p.type })),
      spatial,
      time: {
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
        if (!response || !response.success) {
          throwServerError(response);
        }
        return response;
      })
      .catch((error) => {
        console.error('caught error in create savings scenario', error);
        return null;
      });
  }
};

const refreshSavingsScenario = function (scenarioKey) {
  return function (dispatch, getState) {
    const options = {
      scenarioKey,
    };

    return savingsAPI.refresh(options)
      .then((response) => {
        if (!response || !response.success) {
          throwServerError(response);
        }
        return response;
      })
      .catch((error) => {
        console.error('caught error in refresh savings scenario', error);
        return null;
      });
  }
};

const removeSavingsScenario = function (scenarioKey) {
  return function (dispatch, getState) {
    const options = {
      scenarioKey,
    };

    return savingsAPI.remove(options)
      .then((response) => {
        if (!response || !response.success) {
          throwServerError(response);
        }
        return response;
      })
      .catch((error) => {
        console.error('caught error in remove savings scenario', error);
        return null;
      });
  }
};

const exploreSavingsScenario = function (scenarioKey, clusterKey) {
  return function (dispatch, getState) {
    const options = {
      scenarioKey,
      clusterKey,
    };

    return savingsAPI.explore(options)
      .then((response) => {
        if (!response || !response.success) {
          throwServerError(response);
        }
        return response;
      })
      .catch((error) => {
        console.error('caught error in explore savings scenario', scenarioKey, clusterKey, error);
        return null;
      });
  }
};

const exploreScenariosAllClusters = function (scenarioKey) {
  return function (dispatch, getState) {
    const { clusters = [] } = getState().config.utility;
    return Promise.all(clusters.map(cluster => dispatch(exploreSavingsScenario(scenarioKey, cluster.key))))
      .then(clusters => clusters.filter(c => c != null))
      .then(clusters => clusters.map(cluster => ({ ...cluster, segments: cluster.segments.sort(sortSegments) })))
      .then(clusters => dispatch(setExploreData({ clusters })));
  };
};

const fetchSavings = function (query) {
  return function (dispatch, getState) {
    return savingsAPI.query({ query })
      .then((response) => {
        if (!response || !response.success) {
          throwServerError(response);
        }
        return response;
      })
      .catch((error) => {
        console.error('caught error in query savings scenarios', error);
        return null;
      });
  };
};

const findSavingsScenario = function (scenarioKey) {
  return function (dispatch, getState) {
    return savingsAPI.find({ scenarioKey })
      .then((response) => {
        if (!response || !response.success) {
          throwServerError(response);
        }
        return response.scenario;
      })
      .catch((error) => {
        console.error('caught error in find savings scenario', error);
        return null;
      });
  };
};

const fetchSavingsScenario = function (scenarioKey) {
  return function (dispatch, getState) {
    return dispatch(findSavingsScenario(scenarioKey))
      .then((scenario) => {
        dispatch(setExploreScenario(scenario));
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

const querySavingsScenarios = function () {
  return function (dispatch, getState) {
    return dispatch(fetchSavings(getState().savings.query))
      .then((res) => {
        dispatch(setQuery({ total: res.total }));
        return res.scenarios || [];
      })
      .then(scenarios => dispatch(setSavingsScenarios(scenarios)));
  };
};

const fetchAllAreas = function () {
  return function (dispatch, getState) {
    dispatch(getAreaGroups())
      .then(groups => Promise.all(groups.map(group => dispatch(getAreas(group.key))))
        .then(areas => dispatch(setAreas(areas))));
  };
};

const setQueryAndFetch = function (query) {
  return function (dispatch, getState) {
    dispatch(setQuery(query));
    return dispatch(querySavingsScenarios());
  };
};

module.exports = {
  addSavingsScenario,
  refreshSavingsScenario,
  removeSavingsScenario,
  confirmRemoveScenario,
  setSearchFilter,
  querySavingsScenarios,
  fetchCompleted,
  setQuery,
  setQueryAndFetch,
  fetchAllAreas,
  fetchSavingsScenario,
  exploreScenariosAllClusters,
};
