var moment = require('moment');

var ActionTypes = require('../constants/ActionTypes');

var actions = {

  setup: (source, field, now) => ({
    type: ActionTypes.overview.SETUP,
    source,
    field,
    now: now,
    requested: moment().valueOf(),
  }),

};

module.exports = actions;
