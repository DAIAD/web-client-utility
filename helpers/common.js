const nameToId = str => 
  str.replace(/\s+/g, '-').toLowerCase();

const getFeature = (area) => {
  return {
    'type' : 'Feature',
    'geometry' : area.geometry,
    'properties' : {
      'label' : area.title,
      'clusterKey': area.groupKey,
      'value': area.key,
    }
  };
};

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
          'budget': accounts[index].budget,
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

const throwServerError = response => {
  if (response.status === 401 || response.status === 403) {
    throw new Error('unauthorized');
  } else if (response && response.errors && response.errors.length > 0) {
    throw new Error(response.errors[0].code);
  }
  throw new Error('unknownError');
};

module.exports = {
  nameToId,
  extractFeatures,
  getFeature,
  throwServerError,
};
