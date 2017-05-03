var types = require('../constants/GroupActionTypes');
var groupAPI = require('../api/group');
var userAPI = require('../api/user');

var requestedGroup = function (){
  return {
    type : types.GROUP_REQUEST_GROUP
  };
};

var receivedGroupInfo = function (success, errors, groupInfo){
  return {
    type : types.GROUP_RECEIVE_GROUP_INFO,
    success : success,
    errors : errors,
    groupInfo : groupInfo
  };
};

var receivedGroupMembers = function (success, errors, members){
  return {
    type : types.GROUP_RECEIVE_GROUP_MEMBERS,
    success : success,
    errors : errors,
    members : members
  };
};


var GroupActions = {

  showGroup : function(groupId){
    return function (dispatch, getState) {
      dispatch(requestedGroup());

      return groupAPI.getGroup(groupId).then(function(response) {
        dispatch(receivedGroupInfo(response.success, response.errors, response.groupInfo));

        return groupAPI.getGroupMembers(groupId).then( function (response) {
          dispatch(receivedGroupMembers(response.success, response.errors, response.members));
        }, function (error) {
          dispatch(receivedGroupMembers(false, error, null));
        });

      }, function(error){
        dispatch(receivedGroupInfo(false, error, null));
      });
    };
  },

  resetComponent : function() {
    return {
      type : types.GROUP_RESET_COMPONENT
    };
  },

  addFavorite : function(userKey) {
    return function(dispatch, getState) {
      dispatch({
        type : types.ADD_FAVORITE_REQUEST,
        userKey : userKey
      });

      return userAPI.addFavorite(userKey).then(function(response) {
        dispatch({
          type : types.ADD_FAVORITE_RESPONSE,
          success : response.success,
          errors : response.errors,
          key: userKey,
          favourite: true
        });
      }, function(error) {
        dispatch({
          type : types.ADD_FAVORITE_RESPONSE,
          success : false,
          errors : error
        });
      });
    };
  },

  removeFavorite : function(userKey) {
    return function(dispatch, getState) {
      dispatch({
        type : types.REMOVE_FAVORITE_REQUEST,
        userKey : userKey
      });

      return userAPI.removeFavorite(userKey).then(function(response) {
        dispatch({
          type : types.REMOVE_FAVORITE_RESPONSE,
          success : response.success,
          errors : response.errors,
          key: userKey,
          favourite: false
        });
      }, function(error) {
        dispatch({
          type : types.REMOVE_FAVORITE_RESPONSE,
          success : false,
          errors : error
        });
      });
    };
  }

};

module.exports = GroupActions;
