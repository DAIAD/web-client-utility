var moment = require('moment');

var types = require('../constants/GroupCatalogActionTypes');

var groupAPI = require('../api/group');
var queryAPI = require('../api/query');

var population = require('../model/population');

var _buildGroupQuery = function(population, metric, timezone, from, to) {
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
      "metrics":[metric]
      }
    ]
  };
};

var _groupChartRequest = function(query, key) {
  return {
    type : types.GROUP_CATALOG_CHART_REQUEST,
    query : query,
    groupKey : key
  };
};

var _groupChartResponse = function(success, errors, data, key, t=null) {
  return {
    type : types.GROUP_CATALOG_CHART_RESPONSE,
    success : success,
    errors : errors,
    dataChart : data,
    groupKey : key,
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

var changeIndex = function(index) {
  return {
    type : types.GROUP_CATALOG_INDEX_CHANGE,
    index : index
  };
};

var deleteGroupInit = function(groupKey) {
  return {
    type : types.GROUP_CATALOG_DELETE_REQUEST,
    groupKey : groupKey
  };
};

var deleteGroupComplete = function(success, errors) {
  return {
    type : types.GROUP_CATALOG_DELETE_RESPONSE,
    success : success,
    errors : errors
  };
};

var GroupCatalogActionCreators = {

  changeIndex : function(index) {
    return changeIndex(index);
  },

  getGroups : function() {
    return function(dispatch, getState) {
      dispatch(changeIndex(0));

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

  deleteGroup : function(groupKey) {
    return function(dispatch, getState) {
      dispatch(deleteGroupInit(groupKey));

      return groupAPI.remove(groupKey).then(
          function(response) {
            dispatch(deleteGroupComplete(response.success, response.errors));

            dispatch(getGroupsInit());

            return groupAPI.getGroups(getState().userCatalog.query).then(
                function(response) {
                  dispatch(getGroupsComplete(response.success, response.errors, response.total, response.groups,
                      response.index, response.size));
                }, function(error) {
                  dispatch(getGroupsComplete(false, error));
                });

          }, function(error) {
            dispatch(deleteGroupComplete(false, error));
          });
    };
  },

  clearChart : function() {
    return {
      type : types.GROUP_CATALOG_CLEAR_CHART
    };
  },
  
  getGroupChart : function(group, key, name, timezone) {

    return function(dispatch, getState) {
      var promises =[];

      var interval = getState().forecasting.interval;
      var metric = getState().groupCatalog.metric;

      var query = _buildGroupQuery(group, metric, timezone, interval[0].toDate().getTime(), interval[1].toDate().getTime());   
      dispatch(_groupChartRequest(query, group[0].group)); //group[0].group -> group key

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
            var [g, rr] = population.fromString(rs.label);

              var timespan1;  
              if(rs.points.length !== 0){
                timespan1 = [rs.points[rs.points.length-1].timestamp, rs.points[0].timestamp];
              } else {
                timespan1 = [query.queries[0].time.start, query.queries[0].time.end];
              }              

               //Recalculate xAxis timespan based on returned data. (scale)
               // Shape a normal timeseries result for requested metrics
               // Todo support other metrics (as client-side "average")
               var res2 = query.queries[0].metrics.map(metric => ({
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

          dispatch(_groupChartResponse(success, errors, _.flatten(resAll), group[0].group));

          return _.flatten(resAll);
        }
      );
    };
  },
  
  addFavorite : function(groupKey) {
    return function(dispatch, getState) {
      dispatch({
        type : types.GROUP_CATALOG_ADD_FAVORITE_REQUEST,
        groupKey : groupKey
      });

      return groupAPI.addFavorite(groupKey).then(function(response) {
        dispatch({
          type : types.GROUP_CATALOG_ADD_FAVORITE_RESPONSE,
          success : response.success,
          errors : response.errors,
          groupKey : groupKey,
          favorite : true
        });
      }, function(error) {
        dispatch({
          type : types.GROUP_CATALOG_ADD_FAVORITE_RESPONSE,
          success : false,
          errors : error
        });
      });
    };
  },

  removeFavorite : function(groupKey) {
    return function(dispatch, getState) {
      dispatch({
        type : types.GROUP_CATALOG_REMOVE_FAVORITE_REQUEST,
        groupKey : groupKey
      });

      return groupAPI.removeFavorite(groupKey).then(function(response) {
        dispatch({
          type : types.GROUP_CATALOG_REMOVE_FAVORITE_RESPONSE,
          success : response.success,
          errors : response.errors,
          groupKey : groupKey,
          favorite : false
        });
      }, function(error) {
        dispatch({
          type : types.GROUP_CATALOG_REMOVE_FAVORITE_RESPONSE,
          success : false,
          errors : error
        });
      });
    };
  },

  filterByType : function(type) {
    return {
      type : types.GROUP_CATALOG_FILTER_TYPE,
      groupType : type
    };
  },

  filterByName : function(name) {
    return {
      type : types.GROUP_CATALOG_FILTER_NAME,
      name : name
    };
  },

  clearFilter : function() {
    return {
      type : types.GROUP_CATALOG_FILTER_CLEAR
    };
  },

  setChartMetric : function(metric) {
    return {
      type : types.GROUP_CATALOG_SET_METRIC,
      metric : metric
    };
  }

};

module.exports = GroupCatalogActionCreators;
