var queryAPI = require('../api/query');
var groupAPI = require('../api/group');
var types = require('../constants/ForecastingActionTypes');
var population = require('../model/population');
var moment = require('moment');

/**
 * Query builders
 */

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

/**
 * Actions
 */

var _groupChartRequest = function() {
  return {
    type : types.GROUP_CHART_DATA_REQUEST
  };
};

var _userChartRequest = function() {
  return {
    type : types.USER_DATA_REQUEST
  };
};

var _groupChartResponse = function(success, errors, data, t=null) {
  return {
    type : types.GROUP_CHART_DATA_RESPONSE,
    success : success,
    errors : errors,
    data : data,
    timestamp: (t || new Date()).getTime()
  };
};

var _userChartResponse = function(success, errors, data, t=null) {
  return {
    type : types.USER_DATA_RESPONSE,
    success : success,
    errors : errors,
    data : data,
    timestamp: (t || new Date()).getTime()
  };
};

var getGroupsInit = function() {
  return {
    type : types.GROUP_CATALOG_REQUEST
  };
};

var getGroupsComplete = function(success, errors, total, groups, index, size) {
  return {
    type : types.GROUP_CATALOG_RESPONSE,
    success : success,
    errors : errors,
    total : total,
    groups : groups,
    index : index,
    size : size
  };
};

var ForecastingActions = {

  setUser : function(user) {
    return {
      type : types.SET_USER,
      user : user
    };
  },

  setGroup : function(group) {
    return {
      type : types.SET_GROUP,
      group : group
    };
  },

  getUtilityChart : function(group, key, name, timezone) {
    //Build two queries, one for real data and one for forecast data.
    return function(dispatch, getState) {

      var promises =[];

      dispatch(_groupChartRequest());

      var interval = getState().forecasting.interval;
      var actualData, forecast;

      if(group) {
        actualData = _buildGroupQuery(group, timezone, interval[0].toDate().getTime(), interval[1].toDate().getTime());   
        forecast = _buildGroupQuery(group, timezone, interval[0].toDate().getTime(), moment().endOf('month').toDate().getTime());    
      } else {
        actualData = _buildUtilityQuery(key, timezone, interval[0].toDate().getTime(), interval[1].toDate().getTime(), false);   
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

              var timespan1;  
              if(rs.points.length !== 0){
                timespan1 = [rs.points[rs.points.length-1].timestamp, rs.points[0].timestamp];
              } else {
                timespan1 = [actualData.queries[0].time.start, actualData.queries[0].time.end];
              }              

               //Recalculate xAxis timespan based on returned data. (scale)
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

          dispatch(_groupChartResponse(success, errors, _.flatten(resAll)));

          return _.flatten(resAll);
        }
      );
    };
  },
  
  getUserChart : function(id, name, timezone) {
    //Build two queries, one for real data and one for forecast data.
    return function(dispatch, getState) {

      var promises =[];

      dispatch(_userChartRequest());

      var interval = getState().forecasting.interval;
      var actualData, forecast;

      actualData = _buildUserQuery(id, name, timezone, interval[0].toDate().getTime(), interval[1].toDate().getTime());   
      forecast = _buildUserQuery(id, name, timezone, interval[0].toDate().getTime(), interval[1].toDate().getTime());

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
              var g = new population.User(id, rs.label);

              
              var timespan1;
              if(rs.points.length !== 0){
                //Recalculate xAxis timespan based on returned data. (scale). If no data, keep timespan from query
                timespan1 = [rs.points[rs.points.length-1].timestamp, rs.points[0].timestamp];
              } else {
                timespan1 = [actualData.queries[0].time.start, actualData.queries[0].time.end];
              }
              var res2;
              // Shape a normal timeseries result for requested metrics
              // Todo support other metrics (as client-side "average")
              res2 = actualData.queries[0].metrics.map(metric => ({
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

          dispatch(_userChartResponse(success, errors, _.flatten(resAll)));

          return _.flatten(resAll);
        }
      );
    };
  },

  getGroups : function() {
    return function(dispatch, getState) {
      dispatch(getGroupsInit());

      return groupAPI.getGroups(getState().userCatalog.query).then(
          function(response) {

            dispatch(getGroupsComplete(response.success, response.errors, response.total, response.groups,
                response.index, response.size));
          }, function(error) {
            dispatch(getGroupsComplete(false, error));
          });
    };
  },
  
  filterByType : function(type) {
    return {
      type : types.GROUP_CATALOG_FILTER_TYPE,
      groupType : type
    };
  }
};

module.exports = ForecastingActions;
