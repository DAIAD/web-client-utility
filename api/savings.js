var api = require('./base');

var savingsAPI = {
  create: function(data) {
    return api.json('/action/savings/', data, 'PUT');
  },
  refresh: function({ scenarioKey }) {
    return api.json(`/action/savings/refresh/${scenarioKey}`, null, 'GET');
  },
  find: function({ scenarioKey }) {
    return api.json(`/action/savings/${scenarioKey}`, null, 'GET');
  },
  query: function(data) {
    return api.json('/action/savings/query', data);
  },
  explore: function({ scenarioKey, clusterKey }) {
    return api.json(`/action/savings/explore/${scenarioKey}/${clusterKey}`, null, 'GET');
  },
  remove: function({ scenarioKey }) {
    return api.json(`/action/savings/${scenarioKey}`, null, 'DELETE');
  },
};

module.exports = savingsAPI;
