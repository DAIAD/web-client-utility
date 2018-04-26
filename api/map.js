var api = require('./base');

var MapsAPI = {
  getMetersLocations : function() {
    return api.json('/action/spatial/meters', null, 'GET');
  },
  getGroups: function() {
    return api.json('/action/spatial/group', null, 'GET');
  },
  getAreas: function({ groupKey }) {
    return api.json(`/action/spatial/group/${groupKey}/area`, null, 'GET');
  },
};

module.exports = MapsAPI;
