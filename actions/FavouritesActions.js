var types = require('../constants/FavouritesActionTypes');
var favouritesAPI = require('../api/favourites');
var queryAPI = require('../api/query');
var moment = require('moment');
var population = require('../model/population');
var _ = require('lodash');

var requestedFavouriteQueries = function () {
  return {
    type: types.FAVOURITES_REQUEST_QUERIES
  };
};

var receivedFavouriteQueries = function (success, errors, favourites) {
  return {
    type: types.FAVOURITES_RECEIVE_QUERIES,
    success: success,
    errors: errors,
    favourites: favourites
  };
};

var addFavouriteRequest = function () {
  return {
    type: types.FAVOURITES_ADD_FAVOURITE_REQUEST
  };
};

var addFavouriteResponse = function (success, errors) {
  return {
    type: types.FAVOURITES_ADD_FAVOURITE_RESPONSE,
    success: success,
    errors: errors
  };
};

var deleteFavouriteResponse = function (success, errors) {
  return {
    type: types.FAVOURITES_DELETE_QUERY_RESPONSE,
    success: success,
    errors: errors
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
      'timezone' : "Europe/Athens",
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

var _getTimelineInit = function(population, query) {
  return {
    type : types.FAVOURITES_TIMELINE_REQUEST,
    query : query,
    population : population
  };
};

var _getTimelineComplete = function(success, errors, data) {
  return {
    type : types.FAVOURITES_TIMELINE_RESPONSE,
    success : success,
    errors : errors,
    data : data
  };
};

var _setEditorValue = function(editor, value) {
  return {
    type : types.FAVOURITES_SET_EDITOR_VALUE,
    editor : editor,
    value : value
  };
};

var _getFeatures = function(index, timestamp, label) {
  return {
    type : types.FAVOURITES_GET_FEATURES,
    timestamp : timestamp,
    label : label,
    index : index
  };
};

var _chartRequest = function() {
  return {
    type : types.FAVOURITES_CHART_REQUEST
  };
};

var _chartResponse = function(success, errors, data, t=null) {
  return {
    type : types.FAVOURITES_CHART_RESPONSE,
    success : success,
    errors : errors,
    data : data,
    timestamp: (t || new Date()).getTime()
  };
};

var FavouritesActions = {

  setTimezone : function(timezone) {
    return {
      type : types.FAVOURITES_SET_TIMEZONE,
      timezone : timezone
    };
  },
  fetchFavouriteQueries : function() {
    return function(dispatch, getState) {
      dispatch(requestedFavouriteQueries());
      return favouritesAPI.fetchFavouriteQueries().then(function (response) {
        dispatch(receivedFavouriteQueries(response.success, response.errors, response.queries));
      }, function (error) {
        dispatch(receivedFavouriteQueries(false, error, null));
      });
    };
  },

  addCopy : function(favourite) {
    return function(dispatch, getState) {
      dispatch(addFavouriteRequest());
      return favouritesAPI.addFavourite(favourite).then(function (response) {
        dispatch(addFavouriteResponse(response.success, response.errors));
        dispatch(requestedFavouriteQueries());
        return favouritesAPI.fetchFavouriteQueries().then(function (response) {
          dispatch(receivedFavouriteQueries(response.success, response.errors, response.queries));
        }, function (error) {
          dispatch(receivedFavouriteQueries(false, error, null));
        });
          }, function (error) {
            dispatch(addFavouriteResponse(false, error));
        });
    };
  },
  deleteFavourite : function(event) {
    return function(dispatch, getState) {
      dispatch(addFavouriteRequest());
      var fav = getState(event).favourites.favouriteToBeDeleted;
      return favouritesAPI.deleteFavourite(fav).then(function (response) {
        dispatch(deleteFavouriteResponse(response.success, response.errors));
        dispatch(requestedFavouriteQueries());
        return favouritesAPI.fetchFavouriteQueries().then(function (response) {
          dispatch(receivedFavouriteQueries(response.success, response.errors, response.queries));
        }, function (error) {
          dispatch(receivedFavouriteQueries(false, error, null));
        });
          }, function (error) {
            dispatch(deleteFavouriteResponse(false, error));
        });
    };
  },
  openFavourite : function(favourite) {
    return{
      type : types.FAVOURITES_OPEN_SELECTED,
      showSelected : true,
      selectedFavourite: favourite
    };
  },
  getFavouriteMap : function(favourite) {
    return function(dispatch, getState) {
      var population, source, geometry, interval, timezone;

        population = {
          utility: favourite.queries[0].population[0].utility,
          label: favourite.queries[0].population[0].label,
          type: favourite.queries[0].population[0].type
        };
        interval = [moment(favourite.queries[0].time.start),
                    moment(favourite.queries[0].time.end)];
        source = favourite.queries[0].source;

        if(favourite.queries[0].spatial && favourite.queries[0].spatial.length > 1){
          geometry = favourite.queries[0].spatial[1].geometry;
        } else {
          geometry = null;
        }
        dispatch(_setEditorValue('population', population));
        dispatch(_setEditorValue('interval', interval));
        dispatch(_setEditorValue('spatial', geometry));
        dispatch(_setEditorValue('source', source));

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
  getFavouriteChart : function(favourite) {
    return function(dispatch, getState) {
    
      dispatch(_chartRequest());
      
      var promiseArray =[];
      for(let i=0; i<favourite.queries.length; i++){
        promiseArray.push(queryAPI.queryMeasurements({query: favourite.queries[i]}));  
      }

      Promise.all(promiseArray).then(
        res => {
          var source = favourite.queries[0].source; //source is same for all queries
          var resAll = [];
          for(let m=0; m< res.length; m++){
            if (res[m].errors.length) {
              throw 'The request is rejected: ' + res[m].errors[0].description; 
            }
            var resultSets = (source == 'AMPHIRO') ? res[m].devices : res[m].meters;
            var res1 = (resultSets || []).map(rs => {
              var [g, rr] = population.fromString(rs.label);
              
              //Recalculate xAxis timespan based on returned data. (scale)
              var timespan1 =[rs.points[rs.points.length-1].timestamp, rs.points[0].timestamp];
              for(let j=0; j<favourite.queries.length; j++){
                var res2;
                if (rr) {
                  var points = rs.points.map(p => ({
                    timestamp: p.timestamp,
                    values: p.users.map(u => u[rr.field][rr.metric]).sort(rr.comparator),
                  }));

                  // Shape a result with ranking on users
                  res2 =  _.times(rr.limit, (i) => ({
                    source,
                    timespan: timespan1,
                    granularity: favourite.queries[0].time.granularity,
                    metric: favourite.queries[0].metric,
                    population: g,
                    ranking: {...rr.toJSON(), index: i},
                    data: points.map(p => ([p.timestamp, p.values[i] || null]))
                  }));
                } else {
                  // Shape a normal timeseries result for requested metrics
                  // Todo support other metrics (as client-side "average")
                  res2 = favourite.queries[j].metrics.map(metric => ({
                    source,
                    timespan: timespan1,
                    granularity: favourite.queries[j].time.granularity,
                    metric,
                    population: g,
                    data: rs.points.map(p => ([p.timestamp, p.volume[metric]]))
                  }));
                }
                return _.flatten(res2);
              }
            });
            resAll.push(_.flatten(res1)); 
          }
          
          var success = res.every(x => x.success === true); 
          var errors = success ? [] : res[0].errors; //todo - return flattend array of errors
          dispatch(_chartResponse(success, errors, _.flatten(resAll)));
          
          return _.flatten(resAll);
        }
      );
    };
  },
  getFeatures : function(index, timestamp, label) {
    return _getFeatures(index, timestamp, label);
  },
  closeFavourite : function() {
    return{
      type : types.FAVOURITES_CLOSE_SELECTED,
      showSelected : false,
      selectedFavourite : null,
      finished: null,
      data: null
    };
  },

  setActiveFavourite : function(favourite) {
    return {
      type: types.FAVOURITES_SET_ACTIVE_FAVOURITE,
      selectedFavourite: favourite
    };
  },
  openWarning : function(favourite) {
    return {
      type : types.FAVOURITES_DELETE_QUERY_REQUEST,
      favouriteToBeDeleted: favourite
    };
  },
  closeWarning : function() {
    return {
      type : types.FAVOURITES_CANCEL_DELETE_QUERY,
      favouriteToBeDeleted: null
    };
  },
  resetMapState : function() {
    return {
      type : types.FAVOURITES_RESET_MAP_STATE
    };
  }
};


module.exports = FavouritesActions;
