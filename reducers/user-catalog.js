var moment = require('moment');

var types = require('../constants/UserCatalogActionTypes');

var _createInitialSelectionState = function() {
  return {
    enabled : false,
    selected : {}
  };
};

var _createInitialeDataState = function() {
  return {
    total : 0,
    index : 0,
    size : 10,
    accounts : null,
    features : null
  };
};

var _createInitialeState = function() {
  return {
    isLoading : false,
    query : {
      index : 0,
      size : 10,
      text : null,
      serial : null,
      geometry : null
    },
    data : _createInitialeDataState(),
    interval : [
        moment().subtract(30, 'days'), moment()
    ],
    charts : {},
    search : 'text',
    selection : _createInitialSelectionState()
  };
};

var _extractFeatures = function(accounts) {
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

var selectionReducer = function(state, action) {
  switch (action.type) {
    case types.USER_CATALOG_TOGGLE_CONSUMER:
      var selected = state.selected;

      if (selected.hasOwnProperty(action.id)) {
        delete selected[action.id];
      } else {
        selected[action.id] = true;
      }

      action.accounts.forEach( a => {
        if(a.id === action.id){
          a.selected = !a.selected;
        }
      });
      
      return Object.assign({}, state, {
        enabled : state.enabled,
        selected : selected
      });

    case types.USER_CATALOG_CREATE_BAG_OF_CONSUMER:
      return Object.assign({}, state, {
        enabled : action.enabled,
        selected : {}
      });

    case types.USER_CATALOG_SAVE_BAG_OF_CONSUMER:
      return Object.assign({}, state, {
        enabled : state.enabled,
        selected : {}
      });

    case types.USER_CATALOG_DISCARD_BAG_OF_CONSUMER:
      return Object.assign({}, state, {
        enabled : false,
        selected : {}
      });

    default:
      return _createInitialSelectionState();
  }
};

var dataReducer = function(state, action) {
  switch (action.type) {
    case types.USER_CATALOG_DISCARD_BAG_OF_CONSUMER:
      state.accounts.forEach( a => {
        a.selected = false;
      });
      
      return state;
      
    case types.USER_CATALOG_REQUEST_COMPLETE:

      if (action.success === true) {
        action.accounts.forEach( a => {
          if (action.selection.selected.hasOwnProperty(a.id)) {
            a.selected = true;
          } else {
            a.selected = false;
          }
          
          if (a.meter) {
            a.serial = a.meter.serial;
          }
        });

        return Object.assign({}, state, {
          total : action.total || 0,
          index : action.index || 0,
          size : action.size || 10,
          accounts : action.accounts || [],
          features : _extractFeatures(action.accounts || [])
        });
      } else {
        return Object.assign({}, state, {
          total : 0,
          index : 0,
          size : 10,
          accounts : [],
          features : _extractFeatures([])
        });
      }

    case types.USER_CATALOG_SAVE_BAG_OF_CONSUMER_RESPONSE:
      if(action.success) {
        state.accounts.forEach( a => {
          a.selected = false;
        });
      }
      
      return state;
    case types.USER_CATALOG_ADD_FAVORITE_RESPONSE:
    case types.USER_CATALOG_REMOVE_FAVORITE_RESPONSE:
      if (action.success === true) {
        state.accounts.forEach(function(account) {
          if (account.id === action.userKey) {
            account.favorite = action.favorite;
          }
        });
        return Object.assign({}, state, {
          accounts : state.accounts || [],
        });
      } else {
        return state.data;
      }

    default:
      return state || _createInitialeDataState();
  }
};

var userCatalog = function(state, action) {
  switch (action.type) {
    case types.USER_CATALOG_ADD_FAVORITE_REQUEST:
    case types.USER_CATALOG_REMOVE_FAVORITE_REQUEST:
    case types.USER_CATALOG_SAVE_BAG_OF_CONSUMER_REQUEST:
      return Object.assign({}, state, {
        isLoading : true,
      });

    case types.USER_CATALOG_CHANGE_INDEX:

      return Object.assign({}, state, {
        isLoading : true,
        query : Object.assign({}, state.query, {
          index : (action.index < 0 ? 0 : action.index)
        })
      });

    case types.USER_CATALOG_FILTER_TEXT:

      return Object.assign({}, state, {
        query : Object.assign({}, state.query, {
          text : action.text || '',
          index : 0
        })
      });

    case types.USER_CATALOG_FILTER_SERIAL:

      return Object.assign({}, state, {
        query : Object.assign({}, state.query, {
          serial : action.serial || '',
          index : 0
        })
      });

    case types.USER_CATALOG_SET_SEARCH_GEOMETRY:

      return Object.assign({}, state, {
        query : Object.assign({}, state.query, {
          geometry : action.geometry || null,
          index : 0
        })
      });

    case types.USER_CATALOG_FILTER_CLEAR:

      return Object.assign({}, state, {
        query : Object.assign({}, state.query, {
          text : null,
          serial : null
        })
      });

    case types.USER_CATALOG_REQUEST_INIT:
      return Object.assign({}, state, {
        isLoading : true
      });

    case types.USER_CATALOG_REQUEST_COMPLETE:
      action.selection = state.selection;
      
      return Object.assign({}, state, {
        isLoading : false,
        data : dataReducer(state.data, action)
      });

    case types.USER_CATALOG_SAVE_BAG_OF_CONSUMER_RESPONSE:
      if(action.success) {
        return Object.assign({}, state, {
          isLoading : false,
          data: dataReducer(state.data, action),
          selection: _createInitialSelectionState()
        });
      } else {
        return state;
      }

    case types.USER_CATALOG_CHART_REQUEST:
      var requestCharts = state.charts;
      requestCharts[action.userKey] = {series: null, query:action.query};
      
      return Object.assign({}, state, {
        isLoading : true,
        charts : requestCharts,
        finished: false           
      });  

    case types.USER_CATALOG_CHART_RESPONSE:
      var responseCharts = state.charts;
      if (action.success) {
        responseCharts[action.userKey] = {series: action.dataChart};    

        return Object.assign({}, state, {
          isLoading : false,
          charts : responseCharts,
          finished: action.timestamp
        });
      } else {
        responseCharts[action.userKey] = {series: null};
        return Object.assign({}, state, {
          isLoading : false,
          charts : responseCharts,
          finished: action.timestamp          
        });      
      }
      
    case types.USER_CATALOG_CLEAR_CHART:
      return Object.assign({}, state, {
        isLoading : false,
        charts : {}
      });

    case types.USER_CATALOG_SET_SEARCH_MODE:
      return Object.assign({}, state, {
        search : action.search
      });

    case types.USER_RECEIVED_LOGOUT:
      return _createInitialeState();

    case types.USER_CATALOG_ADD_FAVORITE_RESPONSE:
    case types.USER_CATALOG_REMOVE_FAVORITE_RESPONSE:
      return Object.assign({}, state, {
        isLoading : false,
        data : dataReducer(state.data, action)
      });

    case types.USER_CATALOG_CREATE_BAG_OF_CONSUMER:
    case types.USER_CATALOG_TOGGLE_CONSUMER:
    case types.USER_CATALOG_SAVE_BAG_OF_CONSUMER:
    case types.USER_CATALOG_DISCARD_BAG_OF_CONSUMER:
      action.accounts = state.data.accounts;

      return Object.assign({}, state, {
        data : dataReducer(state.data, action),
        selection : selectionReducer(state.selection, action)
      });

    default:
      return state || _createInitialeState();
  }
};

module.exports = userCatalog;
