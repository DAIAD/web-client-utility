var mirrorToPath = require('../helpers/path-mirror.js');

var types = mirrorToPath({

  SET_USER : null,
  SET_GROUP : null,
  SET_INTERVAL : null,
  
  GROUP_CATALOG_REQUEST : null,
  GROUP_CATALOG_RESPONSE : null,
  GROUP_CATALOG_FILTER_TYPE : null,
  
  GROUP_CHART_DATA_REQUEST : null,
  GROUP_CHART_DATA_RESPONSE : null,

  USER_DATA_REQUEST : null,
  USER_DATA_RESPONSE : null,
  
  ADD_FAVOURITE_REQUEST: null,
  ADD_FAVOURITE_RESPONSE: null,
  
  USER_RECEIVED_LOGOUT : null

  
});

module.exports = types;
