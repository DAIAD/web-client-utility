var ActionTypes = require('../constants/ActionTypes');

var actions = {

  setReferenceTime: (t) => ({
    type: ActionTypes.trials.SET_REFERENCE_TIME,
    referenceTime: t,
  }),
};

module.exports = actions;
