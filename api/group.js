var api = require('./base');

var GroupAPI = {
    getGroup: function(groupKey) {
      return api.json(`/action/group/${groupKey}`);
    },

    getGroupMembers: function(groupKey) {
      return api.json(`/action/group/members/${groupKey}`);
    },

    create: function(title, members) {
      var data = {
          title: title,
          members:members
      };

      return api.json('/action/group', data, 'PUT');
    },

    remove: function(groupKey) {
      return api.json(`/action/group/${groupKey}`, null, 'DELETE');
    },

    getGroups: function(query) {
      return api.json('/action/group', query);
    },

    addFavorite: function(groupKey) {
      return api.json(`/action/group/favorite/${groupKey}`, null, 'PUT');
    },

    removeFavorite: function(groupKey) {
      return api.json(`/action/group/favorite/${groupKey}`, null, 'DELETE');
    }
  };

module.exports = GroupAPI;
