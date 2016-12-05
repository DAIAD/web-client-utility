const METERS = '/assets/data/meters.geojson';
    
var api = require('./base');

var MapsAPI = {
  getMetersLocations : function() {
    return api.json(METERS);
  },
};

module.exports = MapsAPI;
