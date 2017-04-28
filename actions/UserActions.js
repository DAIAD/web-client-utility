var $ = require('jquery');
var moment = require('moment');
var types = require('../constants/UserActionTypes');
var userAPI = require('../api/user');
var adminAPI = require('../api/admin');
var queryAPI = require('../api/query');
var population = require('../model/population');

var _buildGroupQuery = function(key, label, timezone) {
  var interval = [
      moment().subtract(30, 'days').valueOf(), moment().valueOf()
  ];

  return {
    'query' : {
      'timezone' : timezone,
      'time' : {
        'type' : 'ABSOLUTE',
        'start' : interval[0],
        'end' : interval[1],
        'granularity' : 'DAY'
      },
      'population' : [
        {
          'type' : 'GROUP',
          'label' : label,
          'group' : key
        }
      ],
      'source' : 'METER',
      'metrics' : [
        'AVERAGE'
      ]
    }
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
        'AVERAGE'
      ]}
    ]
  };
};

var _buildPopulationQuery = function(population, timezone) {
  var interval = [
      moment().subtract(30, 'days').valueOf(), moment().valueOf()
  ];
  return {
    "level":"week",
    "field":"volume",
    "overlap":null,
    "queries":[{
      "time": {
        "type":"ABSOLUTE",
        "granularity":"DAY",
        "start":interval[0],
        "end":interval[1]
      },
      "population":population,
      "source":"METER",
      "metrics":["AVERAGE"]
      }
    ]
  };
};

var _userChartRequest = function(query, userKey) {
  return {
    type : types.USER_CHART_REQUEST,
    query : query,
    userKey : userKey    
  };
};

var _userChartResponse = function(success, errors, data, userKey, t=null) {
  return {
    type : types.USER_CHART_RESPONSE,
    success : success,
    errors : errors,
    dataChart : data,
    userKey : userKey,
    timestamp: (t || new Date()).getTime()
  };
};

var _groupChartRequest = function(query, key) {
  return {
    type : types.USER_GROUP_CHART_REQUEST,
    query : query,
    groupKey : key
  };
};

var _groupChartResponse = function(success, errors, data, key, t=null) {
  return {
    type : types.USER_GROUP_CHART_RESPONSE,
    success : success,
    errors : errors,
    dataChart : data,
    groupKey : key,
    timestamp: (t || new Date()).getTime()
  };
};

var requestedUser = function() {
  return {
    type : types.USER_REQUEST_USER
  };
};

var receivedUser = function(success, errors, user, meters, devices, configurations, groups, favorite) {
  return {
    type : types.USER_RECEIVE_USER_INFO,
    success : success,
    errors : errors,
    favorite : favorite,
    user : user,
    meters : meters,
    devices : devices,
    configurations : configurations,
    groups : groups
  };
};

var selectAmphiro = function(userKey, deviceKey) {
  return {
    type : types.SELECT_AMPHIRO,
    userKey : userKey,
    deviceKey : deviceKey
  };
};

var requestedSessions = function(userKey, deviceKey) {
  return {
    type : types.AMPHIRO_REQUEST,
    userKey : userKey,
    deviceKey : deviceKey
  };
};

var receivedSessions = function(success, errors, devices, t=null) {
  return {
    type : types.AMPHIRO_RESPONSE,
    success : success,
    errors : errors,
    devices : devices,
    timestamp: (t || new Date()).getTime()
  };
};

var requestedMeters = function(userKey) {
  return {
    type : types.METER_REQUEST,
    userKey : userKey
  };
};

var receivedMeters = function(success, errors, meters) {
  return {
    type : types.METER_RESPONSE,
    success : success,
    errors : errors,
    meters : meters
  };
};

var requestedGroup = function(groupKey, label) {
  return {
    type : types.GROUP_DATA_REQUEST,
    groupKey : groupKey,
    label : label
  };
};

var receivedGroup = function(success, errors, groupKey, meters) {
  return {
    type : types.GROUP_DATA_RESPONSE,
    success : success,
    errors : errors,
    groupKey : groupKey,
    data : (meters.length === 0 ? null : meters[0])
  };
};

var requestedExport = function(userKey, username) {
  return {
    type : types.EXPORT_REQUEST,
    userKey : userKey,
    username : username
  };
};

var receivedExport = function(success, errors, token) {
  return {
    type : types.EXPORT_RESPONSE,
    success : success,
    errors : errors,
    token : token
  };
};

var UserActions = {

  showUser : function(id, timezone) {
    return function(dispatch, getState) {
      dispatch(requestedUser());

      return userAPI.fetchUser(id).then(
          function(response) {
            dispatch(receivedUser(response.success, response.errors, response.user, response.meters, response.devices,
                response.configurations, response.groups, response.favorite));

            var interval = getState().user.interval;
            var query = _buildUserQuery(id, name, timezone, interval[0].toDate().getTime(), interval[1].toDate().getTime()); 
            dispatch(_userChartRequest(query, id));
            
            if (response.meters.length > 0) {
              var promises =[];

              var name = response.user.fullname;

              promises.push(queryAPI.queryMeasurements({query: query.queries[0]}));

              Promise.all(promises).then(
                res => {
                var source = query.queries[0].source; //source is same for all queries
                var resAll = [];
                for(let m=0; m< res.length; m++){
                  if (res[m].errors.length) {
                    throw 'The request is rejected: ' + res[m].errors[0].description; 
                  }
                  var resultSets = res[m].meters;
                  var res1 = (resultSets || []).map(rs => {
                    var g = new population.User(id, rs.label);
                    g.name = name;
                    
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
              });
            } else {
              dispatch(_userChartResponse(true, [], [], id)); //no meters available, return empty data.
            }
          }, function(error) {
            dispatch(receivedUser(false, error, null));
          });
    };
  },

  getGroupChart : function(group, name, timezone) {

    return function(dispatch, getState) {
      var promises =[];
      var query = _buildPopulationQuery(group, timezone);   

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
              g.name = name;

              //sort points on timestamp in order to handle pre-aggregated data.
              rs.points = _.orderBy(rs.points, 'timestamp', 'desc');
              
              var timespan1;  
              if(rs.points.length !== 0){
                //Recalculate xAxis timespan based on returned data. (scale)
                timespan1 = [rs.points[rs.points.length-1].timestamp, rs.points[0].timestamp];
              } else {
                timespan1 = [query.queries[0].time.start, query.queries[0].time.end];
              }              

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
  
  getSessions : function(userKey, deviceKey) {
    return function(dispatch, getState) {
      var data = getState().user.data;

      if ((data) && (data.devices)) {
        dispatch(selectAmphiro(userKey, deviceKey));

        dispatch(receivedSessions(true, [], data.devices));
      } else {
        dispatch(requestedSessions(userKey, deviceKey));

        return adminAPI.getSessions(userKey).then(function(response) {
          dispatch(receivedSessions(response.success, response.errors, response.devices));
        }, function(error) {
          dispatch(receivedSessions(false, error, null));
        });
      }
    };
  },

  getMeters : function(userKey) {
    return function(dispatch, getState) {
      dispatch(requestedMeters(userKey));

      return adminAPI.getMeters(userKey).then(function(response) {
        dispatch(receivedMeters(response.success, response.errors, response.series));
      }, function(error) {
        dispatch(receivedMeters(false, error, null));
      });
    };
  },

  showFavouriteAccountForm : function(accountId) {
    return {
      type : types.USER_SHOW_FAVOURITE_ACCOUNT_FORM,
      accountId : accountId
    };
  },

  hideFavouriteAccountForm : function() {
    return {
      type : types.USER_HIDE_FAVOURITE_ACCOUNT_FORM
    };
  },

  clearGroupSeries : function() {
    return {
      type : types.GROUP_DATA_CLEAR
    };
  },

  getGroupSeries : function(groupKey, label, timezone) {
    return function(dispatch, getState) {
      dispatch(requestedGroup(groupKey, label));

      var query = _buildGroupQuery(groupKey, label, timezone);

      return queryAPI.queryMeasurements(query).then(function(response) {
        if (response.success) {
          dispatch(receivedGroup(response.success, response.errors, groupKey, response.meters));
        } else {
          dispatch(receivedGroup(response.success, response.errors, groupKey, []));
        }
      }, function(error) {
        dispatch(receivedGroup(false, error, null, null));
      });
    };
  },

  exportData : function(userKey, username) {
    return function(dispatch, getState) {
      dispatch(requestedExport(userKey, username));

      return adminAPI.exportUserData(userKey).then(function(response) {
        dispatch(receivedExport(response.success, response.errors, response.token));

        var content = [];
        content.push('<div id="export-download-frame" style="display: none">');
        content.push('<iframe src="/action/data/download/' + response.token + '/"></iframe>');
        content.push('</div>');

        $('#export-download-frame').remove();
        $('body').append(content.join(''));
      }, function(error) {
        dispatch(receivedExport(false, error, null));
      });
    };
  },

  addFavorite : function(userKey) {
    return function(dispatch, getState) {
      dispatch({
        type : types.ADD_FAVORITE_REQUEST,
        userKey : userKey
      });

      return userAPI.addFavorite(userKey).then(function(response) {
        dispatch({
          type : types.ADD_FAVORITE_RESPONSE,
          success : response.success,
          errors : response.errors
        });
      }, function(error) {
        dispatch({
          type : types.ADD_FAVORITE_RESPONSE,
          success : false,
          errors : error
        });
      });
    };
  },

  removeFavorite : function(userKey) {
    return function(dispatch, getState) {
      dispatch({
        type : types.REMOVE_FAVORITE_REQUEST,
        userKey : userKey
      });

      return userAPI.removeFavorite(userKey).then(function(response) {
        dispatch({
          type : types.REMOVE_FAVORITE_RESPONSE,
          success : response.success,
          errors : response.errors
        });
      }, function(error) {
        dispatch({
          type : types.REMOVE_FAVORITE_RESPONSE,
          success : false,
          errors : error
        });
      });
    };
  },

  showAmphiroConfig : function(activeDevice) {
    return {
      type : types.AMPHIRO_CONFIG_SHOW,
      activeDevice : activeDevice
    };
  },

  hideAmphiroConfig : function() {
    return {
      type : types.AMPHIRO_CONFIG_HIDE
    };
  }

};

module.exports = UserActions;
