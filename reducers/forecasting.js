var moment = require('moment');
var types = require('../constants/ForecastingActionTypes');

var _createInitialState = function() {
  return {
    isLoading : false,
    interval : [
      moment().subtract(60, 'day'), moment().endOf('month')
    ],
    ranges : {
      'Last 7 Days' : [
          moment().subtract(6, 'days'), moment()
      ],
      'Last 30 Days' : [
          moment().subtract(29, 'days'), moment()
      ],
      'This Month' : [
          moment().startOf('month'), moment().endOf('month')
      ],
      'Last Month' : [
          moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')
      ]
    },    
    query : null,
    groupSeries : null,
    userSeries : null,
    group : null,
    user : null
  };
};

var _extractFeatures = function(groups) {
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

  groups = groups || [];

  for ( var index in groups) {
    if (groups[index].location) {
      var meter = groups[index].hasOwnProperty('meter') ? groups[index].meter : null;

      geojson.features.push({
        'type' : 'Feature',
        'geometry' : groups[index].location,
        'properties' : {
          'groupKey' : groups[index].id,
          'deviceKey' : meter.key,
          'name' : groups[index].fullname,
          'address' : groups[index].address,
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

var _createInitialGroupState = function() {
  return {
    groups : [],
    filtered: [],
    features : null
  };
};

var _filterRows = function(rows, type, name) {
  var filteredRows = rows.filter( r => {
    if(name) {
      if(r.text.indexOf(name) === -1) {
        return false;
      }
    }
    if(type) {
      return (r.type == type);
    }
    return true;
  });
  return filteredRows;
};

var dataReducer = function(state, action) {
  
  switch (action.type) {
    case types.GROUP_CATALOG_FILTER_TYPE :
      var filteredRows = _filterRows(state || [], action.groupType, action.name);

      return {
        groups : state || [],
        filtered : filteredRows,
        features : _extractFeatures(state || [])
      };
    
    case types.GROUP_CATALOG_RESPONSE:

      if (action.success === true) {
        action.groups.forEach( g => {
          if(g.type == 'SEGMENT') {
            g.text = g.cluster + ': ' + g.name;
          } else {
            g.text = g.name;
          }
        });
        action.groups.sort( (a, b) => {
          if (a.text < b.text) {
            return -1;
          }
          if (a.text > b.text) {
            return 1;
          }
          return 0;
        });
        return {
          total : action.total || 0,
          index : action.index || 0,
          size : action.size || 10,
          groups : action.groups || [],
          filtered : _filterRows(action.groups || [], action.groupType, action.name),
          features : _extractFeatures(action.groups || [])
        };
      } else {

        return {
          total : 0,
          index : 0,
          size : 10,
          groups : [],
          filtered: [],
          features : _extractFeatures([])
        };
      }

    default:
      return state || _createInitialGroupState();
  }
};

var admin = function(state, action) {
  switch (action.type) {
    case types.GROUP_CHART_DATA_REQUEST:
      return Object.assign({}, state, {
        isLoading : true,
        groupSeries: null,
        groupDraw: true,
        groupFinished: false,
        query:action.query
      });

    case types.GROUP_CHART_DATA_RESPONSE:
      if (action.success) {
        return Object.assign({}, state, {
          isLoading : false,
          groupDraw: true,
          groupFinished: action.timestamp,
          groupSeries: action.data
        });
      }

      return Object.assign({}, state, {
        isLoading : false,
        groupDraw: true,
        groupFinished: action.timestamp,
        groupSeries: null
      });
    case types.USER_DATA_REQUEST:

      return Object.assign({}, state, {
        isLoading : true,
        userSeries: null,
        userDraw: true,
        userFinished: false
      });

    case types.USER_DATA_RESPONSE:
      if (action.success) {
        return Object.assign({}, state, {
          isLoading : false,
          userDraw: true,
          userFinished: action.timestamp,
          userSeries: action.data
        });
      }
      return Object.assign({}, state, {
        isLoading : false,
        userDraw: true,
        userFinished: action.timestamp,
        userSeries: null
      });
    case types.GROUP_CATALOG_REQUEST: 
      return Object.assign({}, state, {
        isLoading : false
      });
    case types.GROUP_CATALOG_RESPONSE:
      action.groupType = state.query.type;
      action.name = state.query.name;
      return Object.assign({}, state, {
        isLoading : false,
        groups : dataReducer(state.data, action)
      });
    case types.GROUP_CATALOG_FILTER_TYPE:
      action.name = state.query.name;

      var groups = dataReducer(state.groups.groups, action);
      return Object.assign({}, state, {
        populationType : (action.groupType === 'UNDEFINED' ? null : action.groupType),
        groups : groups,
        group : null
      }); 
    case types.SET_USER:
      return Object.assign({}, state, {
        user : action.user ? action.user : null,
        userSeries: action.user ? state.userSeries : null
      });      
    case types.SET_GROUP:
      return Object.assign({}, state, {
        group : action.group,
      });
    case types.SET_INTERVAL:
      return Object.assign({}, state, {
        interval : action.interval,
      });       
    case types.USER_RECEIVED_LOGOUT:
      return _createInitialState();

    default:
      return state || _createInitialState();
  }
};

module.exports = admin;
