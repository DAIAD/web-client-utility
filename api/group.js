var api = require('./base');

var GroupAPI = {
    fetchGroupInfo: function(key) {
      return api.json(`/action/group/${key}`);
    },

    fetchGroupMembers: function(key) {
      return api.json(`/action/group/members/${key}`);
    },

    create: function(title, members) {
      var data = {
          title: title,
          members:members
      };

      return api.json('/action/group' , data, 'PUT');
    },

    remove: function(groupKey){
      return api.json(`/action/group/${groupKey}`, null, 'DELETE');
    },

    getGroups: function(query) {
      return api.json('/action/group' , query);
    },

    addFavorite: function(groupKey) {
      return api.json(`/action/group/favorite/${groupKey}` , null, 'PUT');
    },

    removeFavorite: function(groupKey) {
      return api.json(`/action/group/favorite/${groupKey}` , null, 'DELETE');
    },

    deleteGroup: function(groupKey) {
      return api.json(`/action/group/${groupKey}` , null, 'DELETE');
    }
  };

module.exports = GroupAPI;
