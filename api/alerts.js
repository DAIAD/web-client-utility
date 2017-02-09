var api = require('./base');

var ManageAlertsAPI = {
    getAllUtilities: function(){
      return api.json('/action/utility/current');
    },
    getTips: function(locale){
      return api.json('/action/tip/localized/' + locale);
    },
    saveActiveTips: function(changedRows){
      return api.json('/action/tip/status/save', changedRows.map((r) => ({id: r.id, active: r.active})));
    },
    insertTip: function(tip){
      return api.json('/action/tip/save', tip);
    },
    deleteTip: function(tip){
      return api.json('/action/tip/delete/' + tip.id, {});
    },
    getAllUtilityUsers: function() {
      return api.json('/action/utility/user/all');
    },
    getAnnouncements: function(){
      return api.json('/action/announcement/history');
    },
    broadcastAnnouncement: function(users, announcement) {
      var receivers = [];
      for(var obj in users){
        receivers.push({accountId: users[obj].id, username: users[obj].username});
      }
      return api.json('/action/announcement/broadcast', {announcement: announcement, receivers: receivers});
    },
    getAllGroups: function(){
      return api.json('/action/groups');
    },
    getUsersOfGroup: function(key){
      return api.json(`/action/group/members/${key}`);
    },
    deleteAnnouncement: function(announcement){
      return api.json('/action/announcement/delete/' + announcement.id, {});
    },
    fetchAnnouncement: function(announcement){
      return api.json('/action/announcement/details/' + announcement.id);
    },
    getMessageStatistics: function(query){
      return api.json('/action/recommendation/statistics', query);
    },
    getAlertReceivers: function(id, query){
      return api.json('/action/alert/receivers/' + id, query);
    },
    getRecommendationReceivers: function(id, query){
      return api.json('/action/recommendation/receivers/' + id, query);
    }
};

module.exports = ManageAlertsAPI;
