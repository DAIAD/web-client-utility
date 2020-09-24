
var ActionTypes = require('../constants/ActionTypes');

var actions = {

  // Plain actions

  setConfiguration: () => ({
    type: ActionTypes.config.reports.SET_CONFIGURATION,
  }),

  // Thunk actions

  configure: () => (dispatch, getState) => {
    // There are no async parts for configuration of reports
    dispatch(actions.setConfiguration());
    return Promise.resolve();
  },
};

module.exports = actions;
