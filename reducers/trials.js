var ActionTypes = require('../constants/ActionTypes');

var initialState = {
  referenceTime: null, 
};

var reduce = function (state, action) {
  var state1 = state || initialState;

  switch (action.type) {
    case ActionTypes.trials.SET_REFERENCE_TIME:
      state1 = _.extend({}, state, {referenceTime: action.referenceTime});
      break;
    default:
      break;
  }

  return state1;
};

module.exports = reduce;
