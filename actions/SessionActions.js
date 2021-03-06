var sessionAPI = require('../api/session');
var types = require('../constants/ActionTypes');

var requestedLogin = function() {
  return {
    type : types.USER_REQUESTED_LOGIN,
  };
};

var receivedLogin = function(status, errors, roles, profile) {
  return {
    type : types.USER_RECEIVED_LOGIN,
    status : status,
    errors : errors,
    roles : roles,
    profile : profile
  };
};

var requestedLogout = function() {
  return {
    type : types.USER_REQUESTED_LOGOUT,
  };
};

var receivedLogout = function(status, errors) {
  return {
    type : types.USER_RECEIVED_LOGOUT,
    status : status,
    errors : errors
  };
};

var SessionActions = {
  login : function(username, password) {
    return function(dispatch, getState) {
      dispatch(requestedLogin());

      return sessionAPI.login(username, password).then(
          function(response) {
            dispatch(receivedLogin(response.success, response.errors, response.roles, response.profile));
          }, function(error) {
            dispatch(receivedLogin(false, error, null));
          });
    };
  },

  logout : function() {
    return function(dispatch, getState) {
      dispatch(requestedLogout());

      return sessionAPI.logout().then(
          function(response) {
            dispatch(receivedLogout(response.success, response.errors));
          }, function(error) {
            dispatch(receivedLogout(false, error));
          });
    };
  },

  refreshProfile : function() {
    return function(dispatch, getState) {
      return sessionAPI.getProfile().then(
          function(response) {
            dispatch(receivedLogin(response.success, response.errors, response.roles, response.profile));
          }, function(error) {
            dispatch(receivedLogin(false, error, {}));
          });
    };
  },
  saveToProfile : function (data) {
    return function(dispatch, getState) {

      return sessionAPI.saveToProfile(data)
      .then(function(response) {
        return response;

      },function(errors) {
        console.error('Error caught on saveToProfile:', errors);
        return errors;
      });
    };
  }

};

module.exports = SessionActions;
