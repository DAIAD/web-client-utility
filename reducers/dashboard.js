var moment = require('moment');

var types = require('../constants/DashboardActionTypes');

var _ = require('lodash');

var _createStatisticsInitialState = function() {
  return {
    counters : null
  };
};

//var _createMapInitialState = function() {
//  return [{
//    interval : [
//        moment().subtract(14, 'day'), moment()
//    ],
//    query : null,
//    areas : null,
//    meters : null,
//    devices : null,
//    timeline : null,
//    features : null
//  }];
//};

var _createChartInitialState = function() {
  return {
    interval : [
        moment().subtract(14, 'day'), moment()
    ],
    query : null,
    series : null
  };
};

var _createInitialState = function() {
  return {
    isLoading : false,
    interval : [
        moment().subtract(14, 'day'), moment()
    ],
    statistics : _createStatisticsInitialState(),
    map : [],
    chart : []
  };
};

var _extractTimeline = function(meters, areas) {

  var timeline = {}, timestamp, label, area, min = NaN, max = NaN;

  for (var m = 0; m < meters.length; m++) {
    var meter = meters[m];

    for (var p = 0; p < meter.points.length; p++) {
      var point = meter.points[p];

      timeline[point.timestamp] = timeline[point.timestamp] || {};
      timestamp = timeline[point.timestamp];

      timestamp[meter.label] = timestamp[meter.label] || {};
      label = timestamp[meter.label];

      label[meter.areaId] = label[meter.areaId] || 0;
      label[meter.areaId] += point.volume.SUM;
    }
  }

  for (timestamp in timeline) {
    for (label in timeline[timestamp]) {
      for (area in timeline[timestamp][label]) {
        var value = timeline[timestamp][label][area];
        if ((isNaN(min)) || (min > value)) {
          min = value;
        }
        if ((isNaN(max)) || (max < value)) {
          max = value;
        }
      }
    }
  }

  timeline.min = min;
  timeline.max = max;

  timeline.getAreas = function() {
    return areas;
  };

  timeline.getTimestamps = function() {
    var values = [];
    for ( var timestamp in this) {
      var value = Number(timestamp);
      if (!isNaN(value)) {
        values.push(value);
      }
    }

    return values.sort(function(t1, t2) {
      if (t1 < t2) {
        return -1;
      }
      if (t1 > t2) {
        return 1;
      }
      return 0;
    });
  };

  timeline.getFeatures = function(timestamp, label) {

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

    if (!timestamp) {
      var timestamps = this.getTimestamps();
      if (timestamps.length > 0) {
        timestamp = timestamps[0];
      } else {
        return geojson;
      }
    }
    if (!label) {
      if (Object.keys(this[timestamp])) {
        label = Object.keys(this[timestamp])[0];
      } else {
        return geojson;
      }
    }

    if (!this[timestamp]) {
      return geojson;
    }
    var instance = this[timestamp][label];

    if (!instance) {
      return geojson;
    }

    var areas = this.getAreas();

    for ( var index in instance) {

      geojson.features.push({
        'type' : 'Feature',
        'geometry' : areas[index].geometry,
        'properties' : {
          'label' : areas[index].label,
          'value' : instance[index]
        }
      });
    }
    
    return geojson;
  };

  return timeline;
};

var statisticsReducer = function(state, action) {
  switch (action.type) {
    case types.COUNTER_REQUEST:
      return Object.assign({}, state, {
        counters : null
      });

    case types.COUNTER_RESPONSE:
      if (action.success) {
        return Object.assign({}, state, {
          counters : action.counters
        });
      }

      return Object.assign({}, state, {
        counters : null
      });

    default:
      return state || _createStatisticsInitialState();
  }
};

var mapReducer = function(state, action) {
  switch (action.type) {
    case types.TIMELINE_REQUEST:
      return [{
        id : action.id,
        title : action.title,
        query : action.query,
        areas : null,
        meters : null,
        devices : null,
        timeline : null,
        features : null,
        index : 0
      }];

    case types.TIMELINE_RESPONSE:
      if (action.success) {
        return [{
          id : action.id,
          title : action.title,
          areas : action.data.areas,
          meters : action.data.meters,
          devices : action.data.devices,
          timeline : _extractTimeline(action.data.meters, action.data.areas),
          features : null
        }];
      }

      return [{
        id : null,
        title : null,
        areas : null,
        meters : null,
        devices : null,
        regions : null,
        features : null
      }];

    case types.GET_FEATURES:

      var pMap = state.length > 0? state.filter(function(map) { return map.id === action.id; }) : null;

      var pMap0 = pMap[0];
      var features = (pMap0.timeline ? pMap0.timeline.getFeatures(action.timestamp, action.label) : null);

      pMap0.features = features;
      pMap0.index = action.index;
      pMap0.id = action.id;
      
     var stateFeatures = state.filter(function( obj ) {
       return obj.id !== action.id;
     });   
     stateFeatures.push(pMap0);
     return stateFeatures;

    default:
      return state || [];
  }
};

var chartReducer = function(state, action) {
  switch (action.type) {
    case types.CHART_REQUEST:
//      return Object.assign({}, state, {
//        draw: true,
//        finished: false,
//        data: null
//      });
      return [{
        id : action.id,
        title : action.title,
        draw : true,
        finished : false,
        data : null
      }];
    case types.CHART_RESPONSE:
      if (action.success) {
        return [{          
          draw: true,
          finished: action.timestamp,
          data: action.data,
          title: action.title,
          id: action.id}];
      } else {
        return [{          
          draw: false,
          finished: false,
          data: null,
          title: action.title,
          id: action.id}];
      }
      
    default:
      return state || _createChartInitialState();
  }
};

var dashboard = function(state, action) {
  switch (action.type) {
    case types.COUNTER_REQUEST:
      return Object.assign({}, state, {
        isLoading : true,
        statistics : statisticsReducer(state.statistics, action)
        //map : mapReducer(state.map, action)
        //chart : chartReducer(state.chart, action)
      });
    case types.COUNTER_RESPONSE:
      return Object.assign({}, state, {
        isLoading : false,
        statistics : statisticsReducer(state.statistics, action)
        //map : mapReducer(state.map, action)
        //chart : chartReducer(state.chart, action)
      });
    case types.TIMELINE_REQUEST:
      var _previousMaps = state.map;
      var tempMaps = mapReducer(state.map, action);
      var mapsRequests = tempMaps.concat(_previousMaps);      
    
      return Object.assign({}, state, {
        isLoading : true,
        map : mapsRequests
      });        
    case types.TIMELINE_RESPONSE:
    
      var _stateMap = state.map;
      var temp = mapReducer(state.map, action);
      var mapComplete = _.unionBy(temp, _stateMap, "id");
      
      return Object.assign({}, state, {
        isLoading : false,
        //statistics : statisticsReducer(state.statistics, action),
        map : mapComplete
        //chart : chartReducer(state.chart, action)
      });  
    case types.GET_FEATURES:
      return Object.assign({}, state, {
        isLoading : false,
        //statistics : statisticsReducer(state.statistics, action),
        map : mapReducer(state.map, action)
      });      
    case types.CHART_REQUEST:
      var _previousCharts = state.chart;
      var tempCharts = chartReducer(state.map, action);
      var chartsRequests = tempCharts.concat(_previousCharts);      
      return Object.assign({}, state, {
        isLoading : true,
        chart : chartsRequests
      });       
    case types.CHART_RESPONSE:
      var _stateChart = state.chart;
      var tempChart = chartReducer(state.chart, action);
      var chartComplete = _.unionBy(tempChart, _stateChart, "id");

      return Object.assign({}, state, {
        isLoading : false,
        chart : chartComplete
      });
    case types.GET_LAYOUT_REQUEST:
      return Object.assign({}, state, {
        isLoading : true
      });
    case types.GET_LAYOUT_RESPONSE:
      return Object.assign({}, state, {
        isLoading : false,
        savedLayout : action.savedLayout
      });   
    case types.FAVOURITES_REQUEST:
      return Object.assign({}, state, {
        isLoading: true
      });
    case types.FAVOURITES_RESPONSE:
      return Object.assign({}, state, {
        isLoading: false,
        favourites: action.favourites
      });    
    case types.UNPIN_REQUEST:
      return Object.assign({}, state, {
        isLoading: true
      });
    case types.UNPIN_RESPONSE:
      return Object.assign({}, state, {
        isLoading: false
      });        
    case types.USER_RECEIVED_LOGOUT:
      return _createInitialState();

    default:
      return state || _createInitialState();
  }
};

module.exports = dashboard;
