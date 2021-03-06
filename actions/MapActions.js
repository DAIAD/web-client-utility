var queryAPI = require('../api/query');
var mapAPI = require('../api/map');
var groupAPI = require('../api/group');
var favouritesAPI = require('../api/favourites');
var adminAPI = require('../api/admin');
var moment = require('moment');
var types = require('../constants/MapActionTypes');

var addFavouriteRequest = function () {
  return {
    type: types.MAP_ADD_FAVOURITE_REQUEST
  };
};

var addFavouriteResponse = function (success, errors) {
  return {
    type: types.MAP_ADD_FAVOURITE_RESPONSE,
    success: success,
    errors: errors
  };
};

var _saveLayoutResponse = function(success, errors) {
  return {
    type : types.MAP_SAVE_LAYOUT_RESPONSE,
    success : success,
    errors : errors
  };
};

var _buildTimelineQuery = function(population, source, geometry, timezone, interval) {
  var spatial = [
    {
      type : 'GROUP',
      group : 'd29f8cb8-7df6-4d57-8c99-0a155cc394c5'
    }
  ];

  if (geometry) {
    spatial.push({
      type : 'CONSTRAINT',
      geometry : geometry,
      operation : 'INTERSECT'
    });
  }
  return {
    'query' : {
      'timezone' : timezone,
      'time' : {
        'type' : 'ABSOLUTE',
        'start' : interval[0].toDate().getTime(),
        'end' : interval[1].toDate().getTime(),
        'granularity' : 'DAY'
      },
      'population' : [
        population
      ],
      spatial : spatial,
      'source' : source,
      'metrics' : [
        'SUM'
      ]
    }
  };
};

var _buildChartQuery = function(key, name, timezone, interval) {
  return {
    'query' : {
      'timezone' : timezone,
      'time' : {
        'type' : 'ABSOLUTE',
        'start' : interval[0].toDate().getTime(),
        'end' : interval[1].toDate().getTime(),
        'granularity' : 'DAY'
      },
      'population' : [
        {
          'type' : 'UTILITY',
          'label' : name,
          'utility' : key
        }
      ],
      'source' : 'METER',
      'metrics' : [
        'SUM'
      ]
    }
  };
};

var _getTimelineInit = function(population, query) {
  return {
    type : types.MAP_TIMELINE_REQUEST,
    query : query,
    population : population
  };
};

var _getTimelineComplete = function(success, errors, data) {
  return {
    type : types.MAP_TIMELINE_RESPONSE,
    success : success,
    errors : errors,
    data : data
  };
};

var _getFeatures = function(index, timestamp, label) {
  return {
    type : types.MAP_GET_FEATURES,
    timestamp : timestamp,
    label : label,
    index : index
  };
};

var _getChartInit = function(key, name, timezone, query) {
  return {
    type : types.MAP_CHART_REQUEST,
    query : query,
    population : {
      key : key,
      name : name,
      timezone : timezone
    }
  };
};

var _getChartComplete = function(success, errors, data) {
  return {
    type : types.MAP_CHART_RESPONSE,
    success : success,
    errors : errors,
    data : data
  };
};

var _setEditorValue = function(editor, value) {
  return {
    type : types.MAP_SET_EDITOR_VALUE,
    editor : editor,
    value : value
  };
};

var _setGroup = function(group) {
  return {
    type : types.MAP_SET_GROUP,
    group : group
  };
};

var metersLocationsRequest = function () {
  return {
    type: types.MAP_METERS_LOCATIONS_REQUEST
  };
};

var metersLocationsResponse = function(success, errors, data) {
  return {
    type: types.MAP_METERS_LOCATIONS_RESPONSE,
    success,
    errors,
    data
  };
};

var getGroupsInit = function() {
  return {
    type : types.MAP_GROUPS_REQUEST
  };
};

var getGroupsComplete = function(success, errors, total, groups, index, size) {
  return {
    type : types.MAP_GROUPS_RESPONSE,
    success : success,
    errors : errors,
    total : total,
    groups : groups,
    index : index,
    size : size
  };
};

var MapActions = {
  setEditor : function(key) {
    return {
      type : types.MAP_SELECT_EDITOR,
      editor : key
    };
  },

  setEditorValue : function(editor, value) {
    return function(dispatch, getState) {
      dispatch(_setEditorValue(editor, value));

      var population = getState().map.population;
      var timezone = getState().map.timezone;
      var interval = getState().map.interval;
      var source = getState().map.source;
      var geometry = getState().map.geometry;
      var query = _buildTimelineQuery(population, source, geometry, timezone, interval);

      dispatch(_getTimelineInit(population, query));
      return queryAPI.queryMeasurements(query).then(function(response) {
        var data = {
          meters : null,
          devices : null,
          areas : null
        };
        if (response.success) {
          data.areas = response.areas;
          data.meters = response.meters;
          data.devices = response.devices;
        }
        dispatch(_getTimelineComplete(response.success, response.errors, data));

        dispatch(_getFeatures(0, null, null));
      }, function(error) {
        dispatch(_getTimelineComplete(false, error, null));

        dispatch(_getFeatures(0, null, null));
      });
    };
  },

  setEditorValuesBatch : function(isDefault) {

    return function(dispatch, getState) {

      var utility = getState().session.profile.utility;
      MapActions.setTimezone(utility.timezone);
      var timezone = getState().map.timezone;
      var population, source, geometry, interval;
      if(isDefault){
        if(!getState().map.timeline) {
          population = {
            utility: utility.key,
            label: utility.name,
            type: 'UTILITY'
          };
        }
        source = 'METER';
        interval = [moment().subtract(14, 'day'), moment()];
        if( (!getState().map.features) || (getState().map.features.length === 0) ){
          geometry = null;
        } else {
          geometry = getState().map.features[0].geometry;
        }
        dispatch(_setEditorValue('population', population));
        dispatch(_setEditorValue('interval', interval));
        dispatch(_setEditorValue('source', source));
        dispatch(_setEditorValue('spatial', geometry));

      } else if(getState().favourites.selectedFavourite){

        var selectedFav = getState().favourites.selectedFavourite.queries[0];

        population = selectedFav.population[0];

        interval = [moment(selectedFav.time.start), moment(selectedFav.time.end)];

        source = selectedFav.source;

        if(selectedFav.spatial && selectedFav.spatial > 1){
          geometry = selectedFav.spatial[1].geometry;
        } else {

          geometry = null;
        }

        var groupPop = {group:population};
        //filterBytype
        var clusterName = population.label.substring(0, population.label.indexOf(":"));

        dispatch(MapActions.filterByType(population.type === 'UTILITY' ? null : clusterName));
        dispatch(MapActions.setGroup(groupPop));
        dispatch(_setEditorValue('population', population));
        dispatch(_setEditorValue('interval', interval));
        dispatch(_setEditorValue('spatial', geometry));
        dispatch(_setEditorValue('source', source));
      }

      var query = _buildTimelineQuery(population, source, geometry, timezone, interval);
      dispatch(_getTimelineInit(population, query));
      return queryAPI.queryMeasurements(query).then(function(response) {
        var data = {
          meters : null,
          devices : null,
          areas : null
        };
        if (response.success) {
          data.areas = response.areas;
          data.meters = response.meters;
          data.devices = response.devices;
        }
        dispatch(_getTimelineComplete(response.success, response.errors, data));

        dispatch(_getFeatures(0, null, null));
      }, function(error) {
        dispatch(_getTimelineComplete(false, error, null));

        dispatch(_getFeatures(0, null, null));
      });
    };
  },
  getChart : function(key, name, timezone) {
    return function(dispatch, getState) {
      var query = _buildChartQuery(key, name, timezone, getState().map.interval);

      dispatch(_getChartInit(key, name, timezone, query));

      return queryAPI.queryMeasurements(query).then(function(response) {
        var data = {
          meters : null,
          devices : null
        };

        if (response.success) {
          data.meters = response.meters;
          data.devices = response.devices;
        }
        dispatch(_getChartComplete(response.success, response.errors, data));
      }, function(error) {
        dispatch(_getChartComplete(false, error, null));
      });
    };
  },

  getTimeline : function(population) {
    return function(dispatch, getState) {
      var timezone = getState().map.timezone;
      var interval = getState().map.interval;
      var source = getState().map.source;
      var geometry = getState().map.geometry;

      var query = _buildTimelineQuery(population, source, geometry, timezone, interval);

      dispatch(_getTimelineInit(population, query));

      return queryAPI.queryMeasurements(query).then(function(response) {
        var data = {
          meters : null,
          devices : null,
          areas : null
        };
        if (response.success) {
          data.areas = response.areas;
          data.meters = response.meters;
          data.devices = response.devices;
        }
        dispatch(_getTimelineComplete(response.success, response.errors, data));

        dispatch(_getFeatures(0, null, null));

      }, function(error) {
        dispatch(_getTimelineComplete(false, error, null));

        dispatch(_getFeatures(0, null, null));
      });
    };
  },

  getFeatures : function(index, timestamp, label) {
    return _getFeatures(index, timestamp, label);
  },

  setTimezone : function(timezone) {
    return {
      type : types.MAP_SET_TIMEZONE,
      timezone : timezone
    };
  },
  addFavourite : function(favourite) {
    return function(dispatch, getState) {
      dispatch(addFavouriteRequest());
      return favouritesAPI.addFavourite(favourite).then(function (response) {
        dispatch(addFavouriteResponse(response.success, response.errors));
      }, function (error) {
        dispatch(addFavouriteResponse(false, error));
      });
    };
  },
  updateFavourite : function(favourite, previousTitle) {
    return function(dispatch, getState) {
      dispatch(addFavouriteRequest());
      return favouritesAPI.updateFavourite(favourite).then(function (response) {
        dispatch(addFavouriteResponse(response.success, response.errors));

        if(response.success && (previousTitle !== favourite.namedQuery.title)){
          //favourite title changed. Must update dashboard layout:

          return adminAPI.getLayout().then(function(response) {
            if(response.success){
              var lays = JSON.parse(response.profile.configuration);

              lays.layout.forEach(function(component) {
                if(component.i === previousTitle){
                  component.i = favourite.namedQuery.title;
                }
              });

              var layoutRequest = {"configuration" : JSON.stringify({"layout": lays.layout})};

              return adminAPI.saveLayout(layoutRequest).then(function(response) {
                if(response.errors.length>0){
                  console.error(response.errors);
                }
              }, function(error) {
                dispatch(_saveLayoutResponse(false, error));
              });      
            }
          }, function(error) {
            dispatch(_saveLayoutResponse(false, error));
          }); 
        }
      }, function (error) {
        dispatch(addFavouriteResponse(false, error));
      });
    };
  },
  getMetersLocations: function() {
    return function(dispatch, getState) {
      dispatch(metersLocationsRequest());
      return mapAPI.getMetersLocations().then(function (response) {
        dispatch(metersLocationsResponse(true, null, response));
      },
       function (error) {
         dispatch(metersLocationsResponse(false, error));
       });
    };
  },

  getGroups : function() {
    return function(dispatch, getState) {
      dispatch(getGroupsInit());
      return groupAPI.getGroups(getState().userCatalog.query).then(function(response) 
        {
          dispatch(getGroupsComplete(response.success, response.errors, response.total, 
              response.groups, response.index, response.size));
        }, function(error) {
          dispatch(getGroupsComplete(false, error));
      });
    };
  },
  filterByType : function(type) {
    return {
      type : types.MAP_FILTER_GROUP_BY_TYPE,
      groupType : type
    };
  },
  setGroup : function(group) {
    return function(dispatch, getState) {
      dispatch(_setGroup(group));
      dispatch(MapActions.setEditorValue('population', group.group));
    };
  },
  getAreaGroups: function() {
    return function(dispatch, getState) {
      return mapAPI.getGroups()
      .then((response) => {
        return response.groups;
      })
      .catch((error) => {
        console.error('caught error', error);
      });
    };
  },
  getAreas: function(groupKey) {
    return function(dispatch, getState) {
      return mapAPI.getAreas({ groupKey })
      .then((response) => {
        return response.areas;
      })
      .catch((error) => {
        console.error('caught error', error);
      });
    };
  },

};

module.exports = MapActions;
