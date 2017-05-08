const METERS = '/assets/data/meters.geojson';
    
var api = require('./base');

var MapsAPI = {
  getMetersLocations : function() {
    return api.json(METERS);
  },
  getGroups: function() {
    return api.json('/action/spatial/group', null, 'GET');
  },
  getAreas: function({ groupKey }) {
    return api.json(`/action/spatial/group/${groupKey}/area`, null, 'GET');
  },
};

module.exports = MapsAPI;
