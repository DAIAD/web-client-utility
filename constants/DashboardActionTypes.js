var mirrorToPath = require('../helpers/path-mirror.js');

var types = mirrorToPath({

  TIMELINE_REQUEST : null,
  TIMELINE_RESPONSE : null,

  GET_FEATURES : null,

  CHART_REQUEST : null,
  CHART_RESPONSE : null,

  COUNTER_REQUEST : null,
  COUNTER_RESPONSE : null,

  USER_RECEIVED_LOGOUT : null,
  
  SAVE_LAYOUT_REQUEST : null,
  SAVE_LAYOUT_RESPONSE : null,
  GET_LAYOUT_REQUEST : null,
  GET_LAYOUT_RESPONSE : null,
  FAVOURITES_REQUEST : null,
  FAVOURITES_RESPONSE : null,
  UNPIN_REQUEST : null,
  UNPIN_RESPONSE : null

});

module.exports = types;
