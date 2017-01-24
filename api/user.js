var api = require('./base');

var UserAPI = {

  getAccounts : function(query) {
    return api.json('/action/user/search', {
      query : query
    });
  },

  fetchUser : function(user_id) {
    return api.json('/action/user/' + user_id);
  },

  addFavorite : function(userKey) {
    return api.json(`/action/user/favorite/${userKey}`, null, 'PUT');
  },

  removeFavorite : function(userKey) {
    return api.json(`/action/user/favorite/${userKey}`, null, 'DELETE');
  }
};

module.exports = UserAPI;
