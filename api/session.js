var api = require('./base');

var SessionAPI = {
  login: function(username, password) {
    return api.submit('/login?application=utility', {username:username, password:password});
  },
  logout: function() {
    return api.submit('/logout', {});
  },
  getProfile: function() {
    return api.json('/action/profile/load');
  },
  saveToProfile: function(data) {
    return api.json('/action/profile/save', data);
  }

};

module.exports = SessionAPI;
