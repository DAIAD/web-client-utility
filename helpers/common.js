const nameToId = str => 
  str.replace(/\s+/g, '-').toLowerCase();

const extractFeatures = accounts => {
  var geojson = {
    type : 'FeatureCollection',
    features : [],
    crs : {
      type : 'name',
      properties : {
        name : 'urn:ogc:def:crs:OGC:1.3:CRS84'
      }
    }
  };

  accounts = accounts || [];

  for ( var index in accounts) {
    if (accounts[index].location) {
      var meter = accounts[index].hasOwnProperty('meter') ? accounts[index].meter : null;
      geojson.features.push({
        'type' : 'Feature',
        'geometry' : accounts[index].location,
        'properties' : {
          'userKey' : accounts[index].id,
          'savings': accounts[index].savings,
          'deviceKey' : meter.key,
          'name' : accounts[index].fullname,
          'address' : accounts[index].address,
          'meter' : {
            'key' : meter.key,
            'serial' : meter.serial
          }
        }
      });
    }
  }
  return geojson;
};

module.exports = {
  nameToId,
  extractFeatures
};
