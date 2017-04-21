var api = require('./base');

var QueryAPI = {
  queryMeasurements : function(request) {
    request.query.usingPreAggregation = properties.dataApiUseAggregatedData || false;

    return api.json('/action/query', request);
  },
  queryForecast : function(request) {
    request.query.usingPreAggregation = properties.dataApiUseAggregatedData || false;

    return api.json('/action/data/meter/forecast', request);
  }
};

module.exports = QueryAPI;
