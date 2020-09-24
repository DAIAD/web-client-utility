
var _ = require('lodash');
var moment = require('moment');

var ActionTypes = require('../constants/ActionTypes');

var initialState = {
  source: 'meter',
  field: 'volume',
  referenceTime:  new moment().subtract(1, 'months').date(1), //moment('2016-03-09T00:00:00Z').valueOf(), //moment().valueOf(), // roughly when page was loaded
  requested: null,
};

var reduce = function (state, action) {
  var state1 = state || initialState;

  switch (action.type) {
    case ActionTypes.overview.SETUP:
      state1 = {
        source: action.source,
        field: action.field,
        referenceTime: action.now,
        requested: action.requested,
      };
      break;
    case ActionTypes.overview.SET_REFERENCE_TIME:
      state1 = _.extend({}, state, {referenceTime: action.now});
      break;
    case ActionTypes.overview.SET_SOURCE:
      state1 = _.extend({}, state, {source: action.source});
      break;
    case ActionTypes.overview.SET_FIELD:
      state1 = _.extend({}, state, {field: action.field});
      break;
    default:
      break;
  }

  return state1;
};

module.exports = reduce;
