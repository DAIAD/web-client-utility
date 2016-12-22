var types = require('../constants/ActionTypes');

var initialState = {
  width: document && document.documentElement ? document.documentElement.clientWidth : null,
  height: document && document.documentElement ? document.documentElement.clientHeight : null
};

var viewport = function(state=initialState, action) {
  switch (action.type) {
    case types.VIEWPORT_SET_SIZE:
      return {
        width: action.width || state.width,
        height: action.height || state.height
      };
    
    default:
      return state;
  }
};

module.exports = viewport;
