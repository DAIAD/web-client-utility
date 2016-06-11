var adminAPI = require('../api/admin');
var queryAPI = require('../api/query');

var types = require('../constants/DashboardActionTypes');

var _buildTimelineQuery = function(key, name, timezone, interval) {
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
      spatial : [
        {
          type : 'GROUP',
          group : 'd29f8cb8-7df6-4d57-8c99-0a155cc394c5'
        }
      ],
      'source' : 'METER',
      'metrics' : [
        'SUM'
      ]
    }
  };
};

var _getTimelineInit = function(query) {
  return {
    type : types.TIMELINE_REQUEST,
    query : query
  };
};

var _getTimelineComplete = function(success, errors, data) {
  return {
    type : types.TIMELINE_RESPONSE,
    success : success,
    errors : errors,
    data : data
  };
};

var _getFeatures = function(timestamp, label) {
  return {
    type : types.GET_FEATURES,
    timestamp : timestamp,
    label : label
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

var DashboardActions = {
  getTimeline : function(key, name, timezone) {
    return function(dispatch, getState) {
      var query = _buildTimelineQuery(key, name, timezone, getState().dashboard.map.interval);

      dispatch(_getTimelineInit(query));

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

        dispatch(_getFeatures(null, null));

      }, function(error) {
        dispatch(_getTimelineComplete(false, error, null));

        dispatch(_getFeatures(null, null));
      });
    };
  },

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

  getFeatures : function(timestamp, label) {
    return _getFeatures(timestamp, label);
  }
};

module.exports = DashboardActions;
