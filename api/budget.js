var api = require('./base');

var budgetAPI = {
  create: function(data) {
    return api.json('/action/budget/', data, 'PUT');
  },
  remove: function({ budgetKey }) {
    return api.json(`/action/budget/${budgetKey}`, null, 'DELETE');
  },
  activate: function({ budgetKey }) {
    return api.json(`/action/budget/${budgetKey}/activate`, null, 'PUT');
  },
  deactivate: function({ budgetKey }) {
    return api.json(`/action/budget/${budgetKey}/deactivate`, null, 'PUT');
  },
  schedule: function({ budgetKey, year, month }) {
    return api.json(`/action/budget/compute/${budgetKey}/${year}/${month}`, null, 'PUT');
  },
  find: function({ budgetKey }) {
    return api.json(`/action/budget/${budgetKey}`, null, 'GET');
  },
  query: function(data) {
    return api.json('/action/budget/query', data);
  },
  exploreCluster: function({ budgetKey, clusterKey }) {
    return api.json(`/action/budget/explore/cluster/${budgetKey}/${clusterKey}`, null, 'GET');
  }, 
  exploreConsumer: function({ budgetKey, consumerKey }) {
    return api.json(`/action/budget/explore/consumer/${budgetKey}/${consumerKey}`, null, 'GET');
  }, 

};

module.exports = budgetAPI;
