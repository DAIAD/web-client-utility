var adminAPI = require('../api/admin');
var queryAPI = require('../api/query');
var favouritesAPI = require('../api/favourites');
var population = require('../model/population');
var types = require('../constants/DashboardActionTypes');
var moment = require('moment');

var defaultChartTitle = "Last 30 Days Average Consumption";
var defaultMapTitle = "Last 30 Days Consumption";

var defaultLayout = [
      {"i":defaultChartTitle,"x":0,"y":1,"w":1,"h":1},
      {"i":defaultMapTitle,"x":0,"y":0,"w":1,"h":1}
];

var getDefaultChart = function(props) {
  var defaultChart = {
    id: 100000,
    pinned : false,
    title:defaultChartTitle,
    type:"CHART",
    tags:"Chart - Meter",
    reportName:"avg-daily-avg",
    level:"week",
    field:"volume",
    queries:[{
      time:{
        type:"ABSOLUTE",
        granularity:"WEEK",
        start:moment().subtract(30, 'day').valueOf(),
        end:moment().valueOf(),
        durationTimeUnit:"HOUR"},
      population:[{
        type:"UTILITY",
        label:"UTILITY:" + props.profile.utility.key,
        ranking:null,
        utility:props.profile.utility.key}],
      source:"METER",
      metrics:["AVERAGE"]
    }]
  };
  return defaultChart;
}

var getDefaultMap = function(props) {
  var defaultMap = {
    id: 100001,
    pinned : false,
    title:defaultMapTitle,
    type:"MAP",
    tags:"Map - Meter",
    queries:[{
      time:{
        type:"ABSOLUTE",
        granularity:"DAY",
        start:moment().subtract(30, 'day').valueOf(),
        end:moment().valueOf(),
        durationTimeUnit:"HOUR"},
      population:[{
        type:"UTILITY",
        label:"Utility",
        ranking:null,
        utility:props.profile.utility.key}],
      source:"METER",
      metrics:["SUM"]
    }]
  };
  return defaultMap;
}

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

var _getTimelineInit = function(query, id, title) {
  return {
    type : types.TIMELINE_REQUEST,
    id : id,
    title : title,
    query : query
  };
};

var _getTimelineComplete = function(success, errors, data, id, title, source) {

  return {
    type : types.TIMELINE_RESPONSE,
    id: id,
    title: title,
    source: source,
    success : success,
    errors : errors,
    data : data
  };
};

var _getFeatures = function(index, timestamp, label, id) {

  return {
    type : types.GET_FEATURES,
    id: id,
    timestamp : timestamp,
    label : label,
    index: index
    
  };
};

var _chartRequest = function(id, title) {
  return {
    type : types.CHART_REQUEST,
    id : id,
    title : title
  };
};

var _chartResponse = function(success, errors, data, title, id, t=null) {
  return {
    type : types.CHART_RESPONSE,
    id : id,
    success : success,
    errors : errors,
    data : success ? data : [],
    timestamp: (t || new Date()).getTime(),
    title: title
  };
};

var _getCountersInit = function() {
  return {
    type : types.COUNTER_REQUEST
  };
};

var _getCountersComplete = function(success, errors, counters) {
  return {
    type : types.COUNTER_RESPONSE,
    success : success,
    errors : errors,
    counters : counters
  };
};

var _saveLayoutRequest = function() {
  return {
    type : types.SAVE_LAYOUT_REQUEST
  };
};

var _saveLayoutResponse = function(success, errors) {
  return {
    type : types.SAVE_LAYOUT_RESPONSE,
    success : success,
    errors : errors
  };
};

var _getLayoutRequest = function() {
  return {
    type : types.GET_LAYOUT_REQUEST
  };
};

var requestedFavouriteQueries = function () {
  return {
    type: types.FAVOURITES_REQUEST
  };
};

var receivedFavouriteQueries = function (success, errors, favourites) {
  return {
    type: types.FAVOURITES_RESPONSE,
    success: success,
    errors: errors,
    favourites: favourites
  };
};

var unpinRequest = function () {
  return {
    type: types.UNPIN_REQUEST
  };
};

var unpinResponse = function (success, errors) {
  return {
    type: types.UNPIN_RESPONSE,
    success: success,
    errors: errors
  };
};

var _getLayoutResponse = function(success, errors, layout) {
  if(layout){
    var configuration = JSON.parse(layout);
    return {
      type : types.GET_LAYOUT_RESPONSE,
      success : success,
      errors : errors,
      savedLayout : configuration.layout
    };
  } else { //return default layout in first login
    return {
      type : types.GET_LAYOUT_RESPONSE,
      success : success,
      errors : errors,
      savedLayout : defaultLayout
    };    
  }
};

var alignLayout = function(layout) {
  if(layout){
    return {
      type : types.GET_LAYOUT_RESPONSE,
      savedLayout : layout
    };
  } else { //return default layout in first login
    return {
      type : types.GET_LAYOUT_RESPONSE,
      savedLayout : defaultLayout
    };    
  }
};

var getChart = function(favourite) {
    return function(dispatch, getState) {
    
      dispatch(_chartRequest(favourite.id, favourite.title));
      
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
                var flatRes2 = _.flatten(res2);
                return flatRes2;
              }
            });
            var flatRes1 = _.flatten(res1);
            resAll.push(flatRes1); 
          }
          var success = res.every(x => x.success === true); 
          var errors = success ? [] : res[0].errors; //todo - return flattend array of errors

          var flatResAll = _.flatten(resAll);
          var title = favourite.title;
          var id = favourite.id;
          dispatch(_chartResponse(success, errors, flatResAll, title, id));          
          return _.flatten(resAll);
        }
      );
    };
  }; 
  
var getTimeline = function(favourite) {

  var id = favourite.id;
  var title = favourite.title;
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
      
      var query = _buildTimelineQuery(population, source, geometry, timezone, interval);
      
      dispatch(_getTimelineInit(query, id, title));

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

        dispatch(_getTimelineComplete(response.success, response.errors, data, id, title, source));

        dispatch(_getFeatures(0, null, null, id));

      }, function(error) {
        dispatch(_getTimelineComplete(false, error, null, null, null, null));

        dispatch(_getFeatures(0, null, null, id));
      });
    };
};
  
var DashboardActions = {

  getCounters : function(key, name, timezone) {
    return function(dispatch, getState) {
      dispatch(_getCountersInit());

      return adminAPI.getCounters().then(function(response) {
        var counters = null;
        
        if (response.success) {
          counters = response.counters;
        }
        dispatch(_getCountersComplete(response.success, response.errors, counters));

      }, function(error) {
        dispatch(_getCountersComplete(false, error, null));
      });
    };
  },

  getFeatures : function(index, timestamp, label, id) {
    return _getFeatures(index, timestamp, label, id);
  }, 
  
  fetchFavouriteQueries : function(props) {

    return function(dispatch, getState) {
      dispatch(requestedFavouriteQueries());
      return favouritesAPI.fetchFavouriteQueries().then(function (response) {

        dispatch(receivedFavouriteQueries(response.success, response.errors, response.queries));

        var pinnedCharts = response.queries.filter(fav => fav.type === "CHART" && fav.pinned === true);

        pinnedCharts.push(getDefaultChart(props)); //adding default chart

        for(var m=0;m<pinnedCharts.length;m++){ 
          dispatch(getChart(pinnedCharts[m]));
        }

        var pinnedMaps = response.queries.filter(fav => fav.type === "MAP" && fav.pinned === true);
        pinnedMaps.push(getDefaultMap(props)); //adding default map
        
        for(var n=0;n<pinnedMaps.length;n++){
          dispatch(getTimeline(pinnedMaps[n]));
        }     
        
      }, function (error) {
        dispatch(receivedFavouriteQueries(false, error, null));
      });
    };
  },
  
  saveLayout : function(layout) {

    return function(dispatch, getState) {
    
      dispatch(_saveLayoutRequest());

      return adminAPI.saveLayout(layout).then(function(response) {
         
        dispatch(_saveLayoutResponse(response.success, response.errors));

      }, function(error) {
      
        dispatch(_saveLayoutResponse(false, error));
        
      });
    };
  },
  
  unpin : function(query, props) {
    //todo - stop unpinned component if it is on timeline play
    
    return function(dispatch, getState) {

      dispatch(unpinRequest());
      //todo - figure out a way not to refetch favourites, 
      //but to remove from local layout and sync layout with components

      var lay = getState().dashboard.savedLayout.filter(function( component ) {
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

              var pinnedCharts = response.queries.filter(fav => fav.type === "CHART" && fav.pinned === true);

              pinnedCharts.push(getDefaultChart(props)); //adding default chart

              for(var m=0;m<pinnedCharts.length;m++){ 
                dispatch(getChart(pinnedCharts[m]));
              }

              var pinnedMaps = response.queries.filter(fav => fav.type === "MAP" && fav.pinned === true);
              pinnedMaps.push(getDefaultMap(props)); //adding default map
        
              for(var n=0;n<pinnedMaps.length;n++){
                dispatch(getTimeline(pinnedMaps[n]));
              }     
        
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
  }
};

module.exports = DashboardActions;
