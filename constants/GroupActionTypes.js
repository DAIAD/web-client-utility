var mirrorToPath = require('../helpers/path-mirror.js');

var types = mirrorToPath({

  GROUP_RESET_COMPONENT: null,

  GROUP_REQUEST_GROUP: null,
  GROUP_RECEIVE_GROUP_INFO: null,
  GROUP_RECEIVE_GROUP_MEMBERS: null,

  ADD_FAVORITE_REQUEST : null,
  ADD_FAVORITE_RESPONSE : null,

  REMOVE_FAVORITE_REQUEST : null,
  REMOVE_FAVORITE_RESPONSE : null

});

module.exports = types;
