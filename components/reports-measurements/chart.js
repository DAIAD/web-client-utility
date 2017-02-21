var _ = require('lodash');
var moment = require('moment');
var numeral = require('numeral');
var React = require('react');
var echarts = require('react-echarts');
var population = require('../../model/population');
var {consolidateFuncs} = require('../../reports').measurements;
var {seriesPropType, configPropType} = require('../../prop-types');
var PropTypes = React.PropTypes;
var theme = require('../chart/themes/blue');

var Chart = React.createClass({
  statics: {
    nameTemplates: {
      basic: _.template('<%= metric %> of <%= label %>'),
      ranking: _.template('<%= ranking.type %>-<%= ranking.index + 1 %> of <%= label %>'),
      forecast: _.template('Forecast - <%= metric %> of <%= label %>'),
    },
   
    defaults: {
      smooth: false,
      tooltip: true,
      fill: 0.3,
      xAxis: {
        dateformat: {
          'minute': 'HH:mm',
          'hour': 'HH:00',
          'day': 'D/MMM',
          'week': 'D/MMM',
          'month': 'MMM/YYYY',
          'quarter': 'Qo YYYY',
          'year': 'YYYY',
        },
      }
    },
  }, 

  propTypes: {
    field: PropTypes.string.isRequired,
    level: PropTypes.string.isRequired,
    reportName: PropTypes.string.isRequired,
    series: PropTypes.arrayOf(seriesPropType),
    finished: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    // Appearence
    draw: PropTypes.bool, // allow parental control on our updates 
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    scaleTimeAxis: PropTypes.bool,
  }, 
  
  contextTypes: {config: configPropType},

  getDefaultProps: function () {
    return {
      draw: true,
      series: [],
      finished: true,
      scaleTimeAxis: false,
      overlap: null,
      overlapping: false,
      forecast: null
    };
  },
  
  shouldComponentUpdate: function (nextProps) {
    var update = (nextProps.draw !== false);
    
    if (!update) console.info('Skipping update of Chart!...');
    return update;
  },

  render: function () {
    var {defaults} = this.constructor;
    var {field, level, reportName} = this.props;
    var {config} = this.context;
    var {unit, name: fieldName} = typeof config === "undefined" ? 
      this.props.context.reports.byType.measurements.fields[field] : config.reports.byType.measurements.fields[field];
    
    //var {title, unit, name: fieldName} = config.reports.byType.measurements.fields[field];
    
    var {xaxisData, series} = this.props.overlapping ? this._overlapData() : this._consolidateData();
    xaxisData || (xaxisData = []);
    
    series = (series || []).map(s => ({
      name: this._getNameForSeries(s),
      fill: defaults.fill,
      smooth: defaults.smooth,
      data: s.data,
    }));

    var xf = defaults.xAxis.dateformat[level];
    var xAxis;
    if(this.props.overlapping){

      var overlapFormat;
      
      if(this.props.overlap.value == 'month'){
        overlapFormat = 'DD';
      } else if(this.props.overlap.value == 'year') {
        overlapFormat = 'MMM';
      } else if (this.props.overlap.value == 'day') {
        overlapFormat = 'LT';
      } else {
        overlapFormat = xf;
      }
      //xAxis data are based on the level aggregation. e.g for week level and year overlapping we get 52 week dates.
      //The viewing of these dates is formatted based on the previous level of the overlap value.
      
      xAxis = {
        data: xaxisData,
        boundaryGap: false,
        formatter: (t) => (moment(t).utc().format(overlapFormat)),
      };     
    } else {
      xAxis = {
        data: xaxisData,
        boundaryGap: false, 
        formatter: (t) => (moment(t).utc().format(xf)),
      };    
    }
    
    return (
      <div className="report-chart" id={['chart', field, level, reportName].join('--')}>
        <echarts.LineChart
          width={this.props.width}
          height={this.props.height}
          loading={this.props.finished? null : {text: 'Loading data...'}}
          tooltip={defaults.tooltip}
          theme={theme}
          xAxis={xAxis}
          yAxis={{
            name: fieldName + (unit? (' (' + unit + ')') : ''),
            numTicks: 4,
            formatter: (y) => (numeral(y).format('0.0a')),
          }}
          series={series}
         />
      </div>
    );
  },

  // Helpers

  _consolidateData: function () {
    var result = {xaxisData: null, series: null};
    var {level, reportName, series, scaleTimeAxis} = this.props;

    var {config} = this.context;
    var _config;
    if(typeof config === "undefined"){
      _config = this.props.context.reports.byType.measurements;
    } else {
      _config = config.reports.byType.measurements;  
    }    

    if (!series || !series.length || series.every(s => !s.data.length))
      return result; // no data available

    var report = _config.levels[level].reports[reportName];
    var {bucket, duration} = typeof config === "undefined"? 
        this.props.context.reports.levels[level] : config.reports.levels[level];     

    var [d, durationUnit] = duration;
    d = moment.duration(d, durationUnit);

    // Use a sorted (by timestamp t) copy of series data [t,y]

    series = series.map(s => (_.extend({}, s, {
      data: s.data.slice(0).sort((p1, p2) => (p1[0] - p2[0])),
    })));

    // Find time range
    
    var start, end;
    if (scaleTimeAxis) {
      start = _.min(series.map(s => s.data[0][0]));
      end = _.max(series.map(s => s.data[s.data.length -1][0]));
    } else {
      start = _.min(series.map(s => s.timespan[0]));
      end = _.max(series.map(s => s.timespan[1]));
    }

    var startx = moment(start).utc().startOf(bucket);
    var endx = moment(end).utc().endOf(bucket);

    // Generate x-axis data,
    result.xaxisData = [];
    for (let m = startx; m < endx; m.add(d)) {
      result.xaxisData.push(m.valueOf());
    }
    
    // Collect points in level-wide buckets
    var groupInBuckets = (data, boundaries) => {
      // Group y values into buckets defined yb x-axis boundaries:
      var N = boundaries.length;
      // For i=0..N-2 all y with (b[i] <= y < b[i+1]) fall into bucket #i ((i+1)-th)
      var yb = []; // hold buckets of y values
      for (var i = 1, j = 0; i < N; i++) {
        yb.push([]);
        while (j < data.length && data[j][0] < boundaries[i]) {
          var y = data[j][1];
          (y != null) && yb[i - 1].push(y);
          j++;
        }
      }
      return yb;
    };
    
    // Consolidate
    var cf = consolidateFuncs[report.consolidate]; 
    result.series = series.map(s => (
      _.extend({}, s, {
        data: groupInBuckets(s.data, result.xaxisData).map(cf)
      })
    ));

    // The number of Y buckets is always N - 1, where N is the number of X points!
    result.xaxisData.pop(); 

    return result;
  },

  _overlapData: function () {
    var result = {xaxisData: null, series: null};
    var {level, reportName, series} = this.props;
    
    if (!series || !series.length || series.every(s => !s.data.length)){
      return result; // no data available    
    }
    
    var maxDuration = 0;
    var minStart = moment();

    for(let k=0; k< series.length; k++) {
      var start1 = moment(series[k].timespan[0]);
      var end1 = moment(series[k].timespan[1]);
      var diff = moment(end1,"DD/MM/YYYY HH:mm:ss").diff(start1,"DD/MM/YYYY HH:mm:ss");
      if(diff<0) {
        console.error('Invalid timespan');
      }
      if(diff > maxDuration){
        maxDuration = diff;
      }
      if(start1.isBefore(minStart)){
        minStart = start1;
      }
    }
    
    var {config} = this.context;
    var _config;
    var {bucket, duration} = typeof config === "undefined" ? this.props.context.reports.levels[level] : config.reports.levels[level];
    if(typeof config === "undefined"){
      _config = this.props.context.reports.byType.measurements;
    } else {
      _config = config.reports.byType.measurements;
    }

    var report = _config.levels[level].reports[reportName];

    var [d, durationUnit] = duration;
    d = moment.duration(d, durationUnit);

    // Use a sorted (by timestamp t) copy of series data [t,y]
    
    series = series.map(s => (_.extend({}, s, {
      data: s.data.slice(0).sort((p1, p2) => (p1[0] - p2[0])),
    })));
    
    //shift series to reference same time period
    for(let n=0; n<series.length; n++){
      if(series[n].data.length === 0 ){
        continue;
      }
      if(series[n].data[0][0] == minStart.valueOf()){
        continue; //this serie defines the starting alignment and won 't be shifted.
      } else {
        //find shift value:
        var subtract = series[n].data[0][0]- minStart.valueOf();      
        for(let m=0; m<series[n].data.length; m++){
          series[n].data[m][0] = series[n].data[m][0]-subtract;
        }
      }
    }
    
    //find time range from min start and max duration in order to overlap    
    var startx = moment(minStart).utc().startOf(bucket);
    var endx = moment(moment(minStart).add(maxDuration).valueOf()).utc().endOf(bucket);
    
    // Generate x-axis data
    result.xaxisData = [];
    for (let m = startx; m < endx; m.add(d)) {
      result.xaxisData.push(m.valueOf());
    }
    
    // Collect points in level-wide buckets
    var groupInBuckets = (data, boundaries) => {
      // Group y values into buckets defined yb x-axis boundaries:
      var N = boundaries.length;
      // For i=0..N-2 all y with (b[i] <= y < b[i+1]) fall into bucket #i ((i+1)-th)
      var yb = []; // hold buckets of y values
      for (var i = 1, j = 0; i < N; i++) {
        yb.push([]);
        while (j < data.length && data[j][0] < boundaries[i]) {
          var y = data[j][1];
          (y != null) && yb[i - 1].push(y);
          j++;
        }
      }
      return yb;
    };

    // Consolidate
    var cf = consolidateFuncs[report.consolidate]; 
    result.series = series.map(s => (
      _.extend({}, s, {
        data: groupInBuckets(s.data, result.xaxisData).map(cf)
      })
    ));

    // The number of Y buckets is always N - 1, where N is the number of X points!
    result.xaxisData.pop(); 
    return result;
  },

  _getNameForSeries: function ({ranking, population: target, metric, timespan, forecast}) {
    //todo - refine label with shorter timelabel?
    var timeLabel = ' ' + moment(timespan[0]).format('DD/MM/YYYY') + '-' +  moment(timespan[1]).format('DD/MM/YYYY');
    var {nameTemplates} = this.constructor;
    var {config} = this.context;

    var label;
    if (target instanceof population.Utility) {
      // Use utility's friendly name
      label = 'Utility' + timeLabel; //config.utility.name;
    } else if (target instanceof population.ClusterGroup) {
      var cluster
      // Use group's friendly name
      if(typeof config === "undefined"){
        cluster = this.props.context.utility.clusters.find(c => (c.key == target.clusterKey));        
      } else {
        cluster = config.utility.clusters.find(c => (c.key == target.clusterKey));
      }
      label = cluster.name + ': ' +
          cluster.groups.find(g => (g.key == target.key)).name + timeLabel;
    } else {
      label = this.props.forecast? this.props.forecast.label : 'Custom Group';
    }
    var tpl;
    if(forecast){ //label per serie if multiple
      tpl = nameTemplates.forecast;
    } else {
      tpl = (ranking)? nameTemplates.ranking : nameTemplates.basic;   
    }

    return tpl({metric, label, ranking});
  }
});

module.exports = Chart;
