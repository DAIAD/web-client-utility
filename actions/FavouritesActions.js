var types = require('../constants/FavouritesActionTypes');
var favouritesAPI = require('../api/favourites');
var queryAPI = require('../api/query');
var adminAPI = require('../api/admin');
var moment = require('moment');
var population = require('../model/population');
var _ = require('lodash');
var defaultChartTitle = "Last 30 Days Average Consumption";
var defaultMapTitle = "Last 30 Days Consumption";

var defaultLayout = [
      {"i":defaultChartTitle,"x":0,"y":1,"w":8,"h":1},
      {"i":defaultMapTitle,"x":0,"y":0,"w":10,"h":1}
];

var _buildGroupQuery = function(population, timezone, from, to) {
  return {
    "level":"week",
    "field":"volume",
    "overlap":null,
    "queries":[{
      "time": {
        "type":"ABSOLUTE",
        "granularity":"DAY",
        "start":from,
        "end":to
      },
      "population":population,
      "source":"METER",
      "metrics":["SUM"]}
    ]
  };
};

var _buildUtilityQuery = function(key, timezone, from, to) {
  return {
    "level":"week",
    "field":"volume",
    "overlap":null,
    "queries":[{
      "time": {
        "type":"ABSOLUTE",
        "granularity":"DAY",
        "start":from,
        "end":to
      },
      "population":[{
        "type":"UTILITY",
        "label":"UTILITY:" + key,
        "ranking":null,
        "utility":key
      }],
      "source":"METER",
      "metrics":["SUM"]}
    ]
  };
};

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

var _getLayoutRequest = function() {
  return {
    type : types.FAVOURITES_GET_LAYOUT_REQUEST
  };
};

var _getLayoutResponse = function(success, errors, layout) {
  if(layout){
    var configuration = JSON.parse(layout);
    return {
      type : types.FAVOURITES_GET_LAYOUT_RESPONSE,
      success : success,
      errors : errors,
      savedLayout : configuration.layout
    };
  } else { //return default layout in first login
    return {
      type : types.FAVOURITES_GET_LAYOUT_RESPONSE,
      success : success,
      errors : errors,
      savedLayout : defaultLayout
    };    
  }
};

var pinRequest = function () {
  return {
    type: types.FAVOURITES_PIN_REQUEST
  };
};

var pinResponse = function (success, errors) {
  return {
    type: types.FAVOURITES_PIN_RESPONSE,
    success: success,
    errors: errors
  };
};

var unpinRequest = function () {
  return {
    type: types.FAVOURITES_UNPIN_REQUEST
  };
};

var unpinResponse = function (success, errors) {
  return {
    type: types.FAVOURITES_UNPIN_RESPONSE,
    success: success,
    errors: errors
  };
};

var alignLayout = function(layout) {
  if(layout){
    return {
      type : types.FAVOURITES_GET_LAYOUT_RESPONSE,
      savedLayout : layout
    };
  } else { //return default layout in first login
    return {
      type : types.FAVOURITES_GET_LAYOUT_RESPONSE,
      savedLayout : defaultLayout
    };    
  }
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

var _saveLayoutRequest = function() {
  return {
    type : types.FAVOURITES_SAVE_LAYOUT_REQUEST
  };
};

var _saveLayoutResponse = function(success, errors) {
  return {
    type : types.FAVOURITES_SAVE_LAYOUT_RESPONSE,
    success : success,
    errors : errors
  };
};

var getLayoutRequest = function() {
  return {
    type : types.FAVOURITES_GET_LAYOUT_REQUEST
  };
};

var getLayoutResponse = function(success, errors, layout) {
  if(layout){
    var configuration = JSON.parse(layout);
    return {
      type : types.FAVOURITES_GET_LAYOUT_RESPONSE,
      success : success,
      errors : errors,
      savedLayout : configuration.layout
    };
  }
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
      if(!fav.namedQuery.pinned){
        
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
      }

      return adminAPI.getLayout().then(function(response) {
        if(response.success){
          var lays = JSON.parse(response.profile.configuration);
          var lay = lays.layout.filter(function( component ) {
            return component.i !== fav.namedQuery.title;
          });  
          var layoutRequest = {"configuration" : JSON.stringify({"layout": lay})};
          
          return adminAPI.saveLayout(layoutRequest).then(function(response) {

            if(response.success){
              return favouritesAPI.deleteFavourite(fav).then(function (response) {
                dispatch(deleteFavouriteResponse(response.success, response.errors));
                return favouritesAPI.fetchFavouriteQueries().then(function (response) {
                  dispatch(receivedFavouriteQueries(response.success, response.errors, response.queries));
                }, function (error) {
                  dispatch(receivedFavouriteQueries(false, error, null));
                });
              }, function (error) {
                dispatch(deleteFavouriteResponse(false, error));
              });            
            }
          }, function(error) {
            dispatch(_saveLayoutResponse(false, error));
          });      
        }
      }, function(error) {
        dispatch(_saveLayoutResponse(false, error));
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

        population = favourite.queries[0].population[0];
        
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
              
              //sort points on timestamp in order to handle pre-aggregated data.
              rs.points = _.orderBy(rs.points, 'timestamp', 'desc');
              
              //Recalculate xAxis timespan based on returned data. (scale)
              var timespan1;
              if(rs.points[rs.points.length-1]){
                timespan1 =[rs.points[rs.points.length-1].timestamp, rs.points[0].timestamp];
              } else {
                //empty result, use initial timespan
                timespan1 = [favourite.queries[0].time.start, favourite.queries[0].time.end];
              }              

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
          var errors = success ? [] : res[0].errors; //todo - return flattend array of errors?
          dispatch(_chartResponse(success, errors, _.flatten(resAll)));
          
          return _.flatten(resAll);
        }
      );
    };
  },
  
  getFavouriteForecast : function(group, key, name, timezone) {
    //Build two queries, one for real data and one for forecast data.
    return function(dispatch, getState) {
      dispatch(_chartRequest());
      var promises =[];

      var interval = getState().forecasting.interval;
      var actualData, forecast;

      if(group) {
        actualData = _buildGroupQuery(group, timezone, interval[0].toDate().getTime(), interval[1].toDate().getTime());   
        forecast = _buildGroupQuery(group, timezone, interval[0].toDate().getTime(), moment().endOf('month').toDate().getTime());    
        
      } else {
        actualData = _buildUtilityQuery(key, timezone, interval[0].toDate().getTime(), interval[1].toDate().getTime());   
        forecast = _buildUtilityQuery(key, timezone, interval[0].toDate().getTime(), moment().endOf('month').toDate().getTime());
      }

      //don' t change push order. It is used below for forecast labels in each serie
      promises.push(queryAPI.queryMeasurements({query: actualData.queries[0]}));
      promises.push(queryAPI.queryForecast({query: forecast.queries[0]}));

      Promise.all(promises).then(
        res => {

          var source = actualData.queries[0].source; //source is same for all queries
          var resAll = [];
          for(let m=0; m< res.length; m++){
            if (res[m].errors.length) {
              throw 'The request is rejected: ' + res[m].errors[0].description; 
            }
            var resultSets = (source == 'AMPHIRO') ? res[m].devices : res[m].meters;
            var res1 = (resultSets || []).map(rs => {
            var [g, rr] = population.fromString(rs.label);

              //sort points on timestamp in order to handle pre-aggregated data.
              rs.points = _.orderBy(rs.points, 'timestamp', 'desc');
              
              var timespan1;  
              if(rs.points.length !== 0){
                //Recalculate xAxis timespan based on returned data. (scale)
                timespan1 = [rs.points[rs.points.length-1].timestamp, rs.points[0].timestamp];
              } else {
                timespan1 = [actualData.queries[0].time.start, actualData.queries[0].time.end];
              }              

               // Shape a normal timeseries result for requested metrics
               // Todo support other metrics (as client-side "average")
               var res2 = actualData.queries[0].metrics.map(metric => ({
                 source,
                 timespan: timespan1,
                 granularity: actualData.queries[0].time.granularity,
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
  },

  getProfileLayout : function() {
    return function(dispatch, getState) {
      dispatch(_getLayoutRequest());
      
      return adminAPI.getLayout().then(function(response) {
        dispatch(_getLayoutResponse(response.success, response.errors, response.profile.configuration));
        
        if(!response.profile.configuration){ //save default layout at first login

          var layoutRequest = {"configuration" : JSON.stringify({"layout": defaultLayout})};
          return adminAPI.saveLayout(layoutRequest).then(function(response) {
            dispatch(_saveLayoutResponse(response.success, response.errors));
          }, function(error) {
            dispatch(_saveLayoutResponse(false, error));
          });        
        }
      }, function(error) {
        dispatch(_getLayoutResponse(false, error));
      });
    };
  },
  
  pinToDashboard : function(query) {
    return function(dispatch, getState) {
      dispatch(pinRequest());
      return favouritesAPI.pinFavourite(query).then(function (response) {
        dispatch(pinResponse(response.success, response.errors));
        dispatch(requestedFavouriteQueries());
        return favouritesAPI.fetchFavouriteQueries().then(function (response) {
          dispatch(receivedFavouriteQueries(response.success, response.errors, response.queries));
          dispatch(getLayoutRequest());
          return adminAPI.getLayout().then(function(response) {

            var configuration = JSON.parse(response.profile.configuration);
            var lay = configuration.layout;
            var maxY = Math.max.apply(Math, lay.map(function(o){return o.y;}));

            var layoutComponent;
            if(query.namedQuery.type === 'CHART' || query.namedQuery.type === 'FORECAST'){
              layoutComponent = {"i": query.namedQuery.title, "x": 0, "y": maxY+1, "w": 8, h: 1}; 
            } else if(query.namedQuery.type === 'MAP' ) {
              layoutComponent = {"i": query.namedQuery.title, "x": 0, "y": maxY+1, "w": 10, h: 1}; 
            }
            lay.push(layoutComponent);
            dispatch(_saveLayoutRequest());
            var layoutRequest = {"configuration" : JSON.stringify({"layout": lay})};
            return adminAPI.saveLayout(layoutRequest).then(function(response) {
              dispatch(_saveLayoutResponse(response.success, response.errors));
            }, function(error) {
              dispatch(_saveLayoutResponse(false, error));
            });  

          }, function(error) {

            dispatch(getLayoutResponse(false, error));
        
          }); 

        }, function (error) {
          dispatch(receivedFavouriteQueries(false, error, null));
        });
          }, function (error) {
            dispatch(pinResponse(false, error));
        });
    };
  },
  
  unpin : function(query) {
    return function(dispatch, getState) {
      dispatch(unpinRequest());

      return adminAPI.getLayout().then(function(response) {

        var configuration = JSON.parse(response.profile.configuration);
        var lay2 = configuration.layout;

        var lay = lay2.filter(function( component ) {
          return component.i !== query.namedQuery.title;
        });

        var layoutRequest = {"configuration" : JSON.stringify({"layout": lay})};

        dispatch(_saveLayoutRequest());
      
        return adminAPI.saveLayout(layoutRequest).then(function(response) {
          dispatch(_saveLayoutResponse(response.success, response.errors));

          if(response.success){
            dispatch(alignLayout(lay)); //aligning new savedLayout        
        
            return favouritesAPI.unpinFavourite(query).then(function (response) {
              dispatch(unpinResponse(response.success, response.errors));
              dispatch(requestedFavouriteQueries());
              
              return favouritesAPI.fetchFavouriteQueries().then(function (response) {
                dispatch(receivedFavouriteQueries(response.success, response.errors, response.queries));  
        
                }, function (error) {
                  dispatch(receivedFavouriteQueries(false, error, null));
                });
            }, function (error) {
                dispatch(unpinResponse(false, error));
            });
          }//if success
        }, function(error) {
          dispatch(_saveLayoutResponse(false, error));
        }); 

      }, function(error) {
        dispatch(getLayoutResponse(false, error));
      });
    };
  },  
};

module.exports = FavouritesActions;
