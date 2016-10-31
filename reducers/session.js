var types = require('../constants/ActionTypes');

var initialState = {
  isLoading : false,
  isAuthenticated : false,
  roles: [],
  profile : null,
  errors : null
};

var session = function(state, action) {
  switch (action.type) {
    case types.USER_REQUESTED_LOGIN:
      return Object.assign({}, state, {
        isLoading : true
      });

    case types.USER_RECEIVED_LOGIN:
      switch (action.status) {
        case true:
          if(document) {
            document.cookie = 'daiad-utility-session=true; path=/';
          }
          
          return Object.assign({}, state, {
            isLoading : false,
            isAuthenticated : true,
            roles : action.roles || [],
            profile : action.profile,
            errors : null
          });

        case false:
          return Object.assign({}, state, {
            isLoading : false,
            isAuthenticated : false,
            roles : [],
            profile : null,
            errors : action.errors,
          });
      }
      break;

    case types.USER_REQUESTED_LOGOUT:
      return Object.assign({}, state, {
        isLoading : true
      });

    case types.USER_RECEIVED_LOGOUT:
      if(document) {
        document.cookie = 'daiad-utility-session=false; path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      }

      switch (action.status) {
        case true:
          return Object.assign({}, state, {
            isLoading : false,
            isAuthenticated : false,
            roles : [],
            profile : null,
            errors : null
          });

        case false:
          return Object.assign({}, state, {
            isLoading : false,
            isAuthenticated : false,
            roles : [],
            profile : null,
            errors : action.errors
          });
      }
      break;

    default:
      return state || initialState;
  }
};

module.exports = session;
