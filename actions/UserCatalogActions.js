var types = require('../constants/UserCatalogActionTypes');

var userAPI = require('../api/user');
var groupAPI = require('../api/group');
var queryAPI = require('../api/query');
var population = require('../model/population');

var _buildUserQuery = function(id, name, timezone, from, to) {
  return {
    'queries' : [{
      'timezone' : timezone,
      'time' : {
        'type' : 'ABSOLUTE',
        'start' : from,
        'end' : to,
        'granularity' : 'DAY'
      },
      'population' : [
        {
          'type' : 'USER',
          'label' : name,
          'users' : [
            id
          ]
        }
      ],
      'overlap':null,
      'source' : 'METER',
      'metrics' : [
        'SUM'
      ]}
    ]
  };
};

var getAccountsInit = function() {
  return {
    type : types.USER_CATALOG_REQUEST_INIT
  };
};

var getAccountsComplete = function(success, errors, total, accounts, index, size) {
  return {
    type : types.USER_CATALOG_REQUEST_COMPLETE,
    success : success,
    errors : errors,
    total : total,
    accounts : accounts,
    index : index,
    size : size
  };
};

var changeIndex = function(index) {
  return {
    type : types.USER_CATALOG_CHANGE_INDEX,
    index : index
  };
};

var toggleFavorite = function() {
  return {
    type : types.USER_CATALOG_FILTER_FAVORITE
  };
};

var clearFilter = function() {
  return {
    type : types.USER_CATALOG_FILTER_CLEAR
  };
};

var setGeometry = function(geometry) {
  return {
    type : types.USER_CATALOG_SET_SEARCH_GEOMETRY,
    geometry : geometry
  };
};

var _userChartRequest = function(query, userKey) {
  return {
    type : types.USER_CATALOG_CHART_REQUEST,
    query : query,
    userKey : userKey    
  };
};

var _userChartResponse = function(success, errors, data, userKey, t=null) {
  return {
    type : types.USER_CATALOG_CHART_RESPONSE,
    success : success,
    errors : errors,
    dataChart : data,
    userKey : userKey,
    timestamp: (t || new Date()).getTime()
  };
};

var _getAccounts = function(dispatch, getState) {
  dispatch(getAccountsInit());

  return userAPI.getAccounts(getState().userCatalog.query).then(
    function(response) {
      dispatch(getAccountsComplete(response.success, response.errors, response.total, response.accounts, response.index, response.size));
    }, function(error) {
      dispatch(getAccountsComplete(false, error));
    });
};

var UserCatalogActionCreators = {

  changeIndex : function(index) {
    return function(dispatch, getState) {
      dispatch(changeIndex(index));

      return userAPI.getAccounts(getState().userCatalog.query).then(
          function(response) {
            dispatch(getAccountsComplete(response.success, response.errors, response.total, response.accounts,
                response.index, response.size));
          }, function(error) {
            dispatch(getAccountsComplete(false, error));
          });
    };
  },

  getAccounts : function() {
    return function(dispatch, getState) {
      return _getAccounts(dispatch, getState);
    }
  },

  filterSerial : function(serial) {
    return {
      type : types.USER_CATALOG_FILTER_SERIAL,
      serial : serial
    };
  },

  filterText : function(text) {
    return {
      type : types.USER_CATALOG_FILTER_TEXT,
      text : text
    };
  },

  toggleFilterFavorite : function() {
    return function(dispatch, getState) {
      dispatch(toggleFavorite());

      return _getAccounts(dispatch, getState);
    }
  },

  clearFilter : function() {
    return function(dispatch, getState) {
      dispatch(clearFilter());

      return _getAccounts(dispatch, getState);
    };
  },

  getUserChart : function(id, name, timezone) {
    return function(dispatch, getState) {

      var promises =[];

      var interval = getState().userCatalog.interval;

      var query = _buildUserQuery(id, name, timezone, interval[0].toDate().getTime(), interval[1].toDate().getTime());   
      
      dispatch(_userChartRequest(query, id));
      
      promises.push(queryAPI.queryMeasurements({query: query.queries[0]}));

      Promise.all(promises).then(
        res => {
          var source = query.queries[0].source; //source is same for all queries
          var resAll = [];
          for(let m=0; m< res.length; m++){
            if (res[m].errors.length) {
              throw 'The request is rejected: ' + res[m].errors[0].description; 
            }
            var resultSets = (source == 'AMPHIRO') ? res[m].devices : res[m].meters;
            var res1 = (resultSets || []).map(rs => {            
              var g = new population.User(id, rs.label);

              //sort points on timestamp in order to handle pre-aggregated data.
              rs.points = _.orderBy(rs.points, 'timestamp', 'desc');

              var timespan1;
              if(rs.points.length !== 0){
                //Recalculate xAxis timespan based on returned data. (scale). If no data, keep timespan from query
                timespan1 = [rs.points[rs.points.length-1].timestamp, rs.points[0].timestamp];
              } else {
                timespan1 = [query.queries[0].time.start, query.queries[0].time.end];
              }
              var res2;
              // Shape a normal timeseries result for requested metrics
              // Todo support other metrics (as client-side "average")
              res2 = query.queries[0].metrics.map(metric => ({
                source,
                timespan: timespan1,
                granularity: query.queries[0].time.granularity,
                metric,
                population: g,
                forecast: m===0 ? false : true, //first promise is actual data, second is forecast data
                data: rs.points.map(p => ([p.timestamp, p.volume[metric]]))
              }));
                return _.flatten(res2);
            });
            resAll.push(_.flatten(res1)); 
          }
          
          var success = res.every(x => x.success === true); 
          var errors = success ? [] : res[0].errors; //todo - return flattend array of errors?

          dispatch(_userChartResponse(success, errors, _.flatten(resAll), id));

          return _.flatten(resAll);
        }
      );
    };
  },
  
  clearChart : function() {
    return {
      type : types.USER_CATALOG_CLEAR_CHART
    };
  },

  setSearchModeText : function() {
    return {
      type : types.USER_CATALOG_SET_SEARCH_MODE,
      search : 'text'
    };
  },

  setSearchModeMap : function() {
    return {
      type : types.USER_CATALOG_SET_SEARCH_MODE,
      search : 'map'
    };
  },

  setGeometry : function(geometry) {
    return function(dispatch, getState) {
      dispatch(setGeometry(geometry));

      dispatch(getAccountsInit());

      return userAPI.getAccounts(getState().userCatalog.query).then(
          function(response) {
            dispatch(getAccountsComplete(response.success, response.errors, response.total, response.accounts,
                response.index, response.size));
          }, function(error) {
            dispatch(getAccountsComplete(false, error));
          });
    };
  },

  addFavorite : function(userKey) {
    return function(dispatch, getState) {
      dispatch({
        type : types.USER_CATALOG_ADD_FAVORITE_REQUEST,
        userKey : userKey
      });

      return userAPI.addFavorite(userKey).then(function(response) {
        dispatch({
          type : types.USER_CATALOG_ADD_FAVORITE_RESPONSE,
          success : response.success,
          errors : response.errors,
          userKey : userKey,
          favorite : true
        });
      }, function(error) {
        dispatch({
          type : types.USER_CATALOG_ADD_FAVORITE_RESPONSE,
          success : false,
          errors : error
        });
      });
    };
  },

  removeFavorite : function(userKey) {
    return function(dispatch, getState) {
      dispatch({
        type : types.USER_CATALOG_REMOVE_FAVORITE_REQUEST,
        userKey : userKey
      });

      return userAPI.removeFavorite(userKey).then(function(response) {
        dispatch({
          type : types.USER_CATALOG_REMOVE_FAVORITE_RESPONSE,
          success : response.success,
          errors : response.errors,
          userKey : userKey,
          favorite : false
        });
        if(getState().userCatalog.query.favorite) {
          return _getAccounts(dispatch, getState);
        }
      }, function(error) {
        dispatch({
          type : types.USER_CATALOG_REMOVE_FAVORITE_RESPONSE,
          success : false,
          errors : error
        });
      });
    };
  },

  setSelectionMode : function(enabled) {
    return {
      type : types.USER_CATALOG_CREATE_BAG_OF_CONSUMER,
      enabled : enabled
    };
  },

  discardBagOfConsumers : function() {
    return {
      type : types.USER_CATALOG_DISCARD_BAG_OF_CONSUMER
    };
  },

  saveBagOfConsumers : function(title, members) {
    return function(dispatch, getState) {
      dispatch({
        type : types.USER_CATALOG_SAVE_BAG_OF_CONSUMER_REQUEST
      });

      return groupAPI.create(title, members).then(function(response) {
        dispatch({
          type : types.USER_CATALOG_SAVE_BAG_OF_CONSUMER_RESPONSE,
          success : response.success,
          errors : response.errors
        });
      }, function(error) {
        dispatch({
          type : types.USER_CATALOG_SAVE_BAG_OF_CONSUMER_RESPONSE,
          success : false,
          errors : error
        });
      });
    };
  },

  toggleConsumer : function(id) {
    return {
      type : types.USER_CATALOG_TOGGLE_CONSUMER,
      id : id
    };
  }

};

module.exports = UserCatalogActionCreators;
