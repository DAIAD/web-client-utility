var types = require('../constants/ActionTypes');

var ViewportActions = {
  resize: function(width, height) {
    return {
      type: types.VIEWPORT_SET_SIZE,
      width,
      height
    };
  },
};

module.exports = ViewportActions;
