var types = require('../constants/GroupActionTypes');

var initialState = {
    isLoading : false,
    groupInfo : null,
    currentMembers : null
};

var createMembersRows = function(membersInfo){
  var members = {};
  membersInfo.forEach(function(m){
    var member = {
        key: m.key,
        username: m.username,
        fullName: m.fullName,
        createdOn: new Date (m.createdOn),
        email: m.username,
        favourite: m.favourite
    };
    members[m.key] = member;
  });

  return members;
};

var group = function(state, action) {

  switch (action.type) {

  case types.GROUP_REQUEST_GROUP:
    return Object.assign({}, state, {
      isLoading : true
    });

  case types.GROUP_RECEIVE_GROUP_INFO:
    return Object.assign({}, state, {
      success : action.success,
      errors : action.errors,
      groupInfo : {
        name : action.groupInfo.name,
        description : action.groupInfo.name,
        createdOn : new Date (action.groupInfo.creationDateMils),
        country : action.groupInfo.country,
        size : action.groupInfo.numberOfMembers
      }
    });

  case types.GROUP_RECEIVE_GROUP_MEMBERS:
    return Object.assign({}, state, {
      isLoading : false,
      success : action.success,
      errors : action.errors,
      currentMembers : createMembersRows(action.members)
    });

  case types.GROUP_RESET_COMPONENT:
    return Object.assign({}, state, {
      isLoading : false,
      groupInfo : null,
      currentMembers : null
    });

  case types.ADD_FAVORITE_REQUEST:
  case types.REMOVE_FAVORITE_REQUEST:
    return Object.assign({}, state, {
      isLoading : true
    });

  case types.ADD_FAVORITE_RESPONSE:
  case types.REMOVE_FAVORITE_RESPONSE:
    if (action.success === true) {
      for(var key in state.currentMembers) {
        if (key === action.key) {
          state.currentMembers[key].favourite = action.favourite;
        }
      }
      return Object.assign({}, state, {
        isLoading : false,
        currentMembers : state.currentMembers || [],
      });
    } else {
      return Object.assign({}, state, {
        isLoading : false
      });
    }

  default:
    return state || initialState;
  }

};

module.exports = group;
