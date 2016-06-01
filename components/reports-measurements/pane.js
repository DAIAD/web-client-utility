
var _ = require('lodash');
var moment = require('moment');
var React = require('react');
var ReactRedux = require('react-redux');
var ReactBootstrap = require('react-bootstrap');
var {Button, Glyphicon} = ReactBootstrap;
var DatetimeInput = require('react-datetime');

var echarts = require('react-echarts');
var Select = require('react-controls/select-dropdown');

var Granularity = require('../../model/granularity');
var TimeSpan = require('../../model/timespan');
var population = require('../../model/population');
var reports = require('../../reports');
var consolidateFn = require('../../consolidate');
var {timespanPropType, populationPropType, seriesPropType} = require('../../prop-types');

var PropTypes = React.PropTypes;
var commonPropTypes = { 
  field: PropTypes.string,
  level: PropTypes.string,
  reportName: PropTypes.string,
};

var toOptionElement = ({value, text}) => (
  <option value={value} key={value}>{text}</option>
);

var {computeKey} = reports.measurements;

const REPORT_KEY = 'pane';

//
// Presentational components
//

var Panel = React.createClass({
  
  statics: {
    
    errors: {
      TIMESPAN_INVALID: -1,
      TIMESPAN_TOO_NARROW: -2,
      TIMESPAN_TOO_WIDE: -3,
    },
  
    defaults: {
      datetimeProps: {
        closeOnSelect: true,
        dateFormat: 'DD/MM/YYYY',
        timeFormat: null, 
        inputProps: {size: 8}, 
      },  
    },
    
    timespanOptions: [].concat(
      Array.from(TimeSpan.common.entries()).map(_.spread(
        (name, u) => ({value: name, text: u.title})
      )),
      [{value: '', text: 'Custom...'}]
    ),

    checkTimespan: function (val, level, N=4) {
      var errors = this.errors;
      var [t0, t1] = this.computeTimespan(val);
      
      var dt = t1.valueOf() - t0.valueOf();
      if (dt <= 0)
        return errors.TIMESPAN_INVALID;
      
      var dl = Granularity.fromName(level).valueOf();
      if (dl >= dt)
        return errors.TIMESPAN_TOO_NARROW;
      
      if (dl * Math.pow(10, N) < dt)
        return errors.TIMESPAN_TOO_WIDE; // N orders of magnitude bigger than dl
      
      return 0;
    },
 
    computeTimespan: function (val) {
      // Convert to a pair of moment instances
      if (_.isString(val)) {
        return TimeSpan.fromName(val).toRange();
      } else if (_.isArray(val)) {
        var t0 = _.isNumber(val[0])? moment(val[0]) : val[0]; 
        var t1 = _.isNumber(val[1])? moment(val[1]) : val[1]; 
        return [t0, t1];
      }
    },
    
    extractPopulationGroupParams: function (target) {
      var clusterKey, groupKey;
      if (target instanceof population.Cluster) {
        clusterKey = target.key; 
        groupKey = null;
      } else if (target instanceof population.ClusterGroup) {
        clusterKey = target.clusterKey; 
        groupKey = target.key;
      } else if (target instanceof population.Utility) { 
        clusterKey = groupKey = null;
      } else if (target instanceof population.Group) {
        clusterKey = null; 
        groupKey = target.key;
      }
      return [clusterKey, groupKey];
    },

  },
  
  propTypes: {
    ...commonPropTypes,
    source: PropTypes.oneOf(['meter', 'device']),
    timespan: timespanPropType,
    population: populationPropType,
  },

  contextTypes: {
    config: PropTypes.object,
  },

  // Lifecycle

  getInitialState: function () {
    return {
      dirty: false,
      error: null,
      errorMessage: null,
      timespan: this.props.timespan,
    };
  },

  getDefaultProps: function () {
    return {
      source: 'meter',
      timespan: 'month',
      population: null,
    };
  },
  
  componentDidMount: function () {
    var {level, reportName} = this.props;
    
    var _config = this.context.config.reports.byType.measurements; 
    var report = _config.levels[level].reports[reportName];

    this.props.initializeReport({timespan: report.timespan});
    this.props.refreshData();
  },
 
  componentWillReceiveProps: function (nextProps, nextContext) {

    // Check if moving to another report
    if (
      (nextProps.field != this.props.field) || 
      (nextProps.level != this.props.level) ||
      (nextProps.reportName != this.props.reportName)
    ) {
      console.assert(nextContext.config == this.context.config, 
        'Unexpected change for configuration in context!');
      var _config = nextContext.config.reports.byType.measurements;
      var report = _config.levels[nextProps.level].reports[nextProps.reportName];

      this.setState({dirty: false, error: null, errorMessage: null});
      nextProps.initializeReport({timespan: report.timespan});
      setTimeout(nextProps.refreshData, 100);
    }
    
    // Reset timespan
    if (nextProps.timespan != this.props.timespan) {
      this.setState({timespan: nextProps.timespan});
    }
  },

  render: function () {
    var cls = this.constructor;
    var {config} = this.context;
    var {field, level, reportName, source, population: target} = this.props;
    var {timespan, error} = this.state;
    
    var _config = config.reports.byType.measurements;
    var [t0, t1] = cls.computeTimespan(timespan);

    var datetimeProps = _.merge({}, cls.defaults.datetimeProps, {
      inputProps: {disabled: _.isString(timespan)? 'disabled' : null}
    });
    
    var sourceOptions = _config.fields[field].sources.map(k => ({
      value: k, text: _config.sources[k].title
    }));

    var timespanOptions = cls.timespanOptions.filter(
      o => (!o.value || cls.checkTimespan(o.value, level) >= 0)
    );

    var clusterOptions = config.utility.clusters.map(
      c => ({value: c.key, text: c.name })
    );
    
    var [clusterKey, groupKey] = cls.extractPopulationGroupParams(target);
    var groupOptions = !clusterKey? [] :
      config.utility.clusters
        .find(c => (c.key == clusterKey))
          .groups.map(g => ({value: g.key, text: g.name}));

    return (
      <form className="form-inline report-panel" 
        id={['panel', field, level, reportName].join('--')} 
       >
        <div className="form-group">
          <label>Source:</label>
          &nbsp;
          <Select
            className="select-source"
            value={source}
            onChange={this._setSource}
           >
            {sourceOptions.map(toOptionElement)}
          </Select>
        </div>
        <div className="form-group">
          <label>Time:</label>
          &nbsp;
          <Select
            className="select-timespan"
            value={_.isString(timespan)? timespan : ''}
            onChange={(val) => (this._setTimespan(val? (val) : ([t0, t1])))} 
           >
            {timespanOptions.map(toOptionElement)}
          </Select>
          &nbsp;
          <DatetimeInput {...datetimeProps} 
            value={t0.toDate()} 
            onChange={(val) => (this._setTimespan([val, t1]))} 
           />
          &nbsp;
          <DatetimeInput {...datetimeProps} 
            value={t1.toDate()}
            onChange={(val) => (this._setTimespan([t0, val]))} 
           />
        </div>
        <div className="form-group">
          <label>Group:</label> 
          &nbsp;
          <Select
            className='select-cluster'
            value={clusterKey || ''}
            onChange={(val) => this._setPopulation(val, null)}
           >
            <option value="" key="" >None</option>
            <optgroup label="Cluster by:">
              {clusterOptions.map(toOptionElement)}
            </optgroup>
          </Select>
          &nbsp;
          <Select
            className='select-cluster-group'
            value={groupKey || ''}
            onChange={(val) => this._setPopulation(clusterKey, val)}
           >
            <optgroup label={clusterKey? 'All groups' : 'No groups'}>
              <option value="" key="">{clusterKey? 'All' : 'Everyone'}</option>
            </optgroup>
            <optgroup label="Pick a specific group:">
              {groupOptions.map(toOptionElement)}
            </optgroup>
          </Select>
        </div>
        <div className="form-group">
          <Button onClick={this._refresh} bsStyle="primary" disabled={!!error} title="Refresh">
            {/*<Glyphicon glyph="repeat" />&nbsp;*/}Refresh
          </Button>
        </div>
        {this._markupHelp()}
      </form>
    )
  },

  // Event handlers

  _setTimespan: function (val) {
    var cls = this.constructor;
    var errors = cls.errors;
    var error = null, errorMessage = null, ts = null;
    
    // Validate
    if (_.isString(val)) {
      // Assume a symbolic name is always valid
      ts = val;
    } else if (_.isArray(val)) {
      // Check if given timespan is a valid range 
      console.assert(val.length == 2 && val.every(t => moment.isMoment(t)), 
        'Expected a pair of moment instances');
      error = cls.checkTimespan(val, this.props.level);
      switch (error) {
        case errors.TIMESPAN_INVALID:
          errorMessage = 'The given timespan is invalid.'
          break;
        case errors.TIMESPAN_TOO_NARROW:
          errorMessage = 'The given timespan is too narrow.'
          break;
        case errors.TIMESPAN_TOO_WIDE: 
          errorMessage = 'The given timespan is too wide.'
          break;
        case 0:
        default:
          ts = [val[0].valueOf(), val[1].valueOf()];
          break;
      }
    }
    
    // Set state and decide if must setTimespan()
    if (ts != null) {
      // The input is valid
      this.props.setTimespan(ts);
    }
    this.setState({dirty: true, timespan: val, error, errorMessage});
    return false;
  },
  
  _setPopulation: function (clusterKey, groupKey) {
    
    var {config} = this.context;
    var p;

    if (!clusterKey && !groupKey) {
      p = new population.Utility(config.utility.key, config.utility.name);
    } else if (clusterKey && !groupKey) {
      p = new population.Cluster(clusterKey);
    } else if (!clusterKey && groupKey) {
      p = new population.Group(groupKey);
    } else {
      p = new population.ClusterGroup(clusterKey, groupKey);
    }

    this.props.setPopulation(p);
    this.setState({dirty: true});
    return false;
  },

  _setSource: function (val) {
    this.props.setSource(val);
    this.setState({dirty: true});
    return false;
  },

  _refresh: function () {
    this.props.refreshData();
    this.setState({dirty: false});
    return false;
  },
  
  // Helpers
  
  _markupHelp: function () {
    
    var {errorMessage, dirty} = this.state;
    var paragraph;
    
    if (errorMessage) {
      paragraph = (<p className="help text-danger">{errorMessage}</p>);
    } else if (dirty) {
      paragraph = (<p className="help text-info">Parameters have changed. Refresh to redraw data!</p>); 
    } else {
      paragraph = (<p className="help text-muted">Refresh to redraw data.</p>);
    }
    return paragraph;
  },

}); 

var Chart = React.createClass({
  
  statics: {
    
    nameTemplates: {
      basic: _.template('<%= metric %> of <%= label %>'),
      ranking: _.template('<%= ranking.type %>-<%= ranking.index + 1 %> of <%= label %>'),
    },
   
    defaults: {
      xAxis: {
        dateformat: {
          'minute': 'HH:mm',
          'hour': 'HH:00',
          'day': 'DD/MM',
          'week': '[W]W/YY', //'dd DD/MM/YYYY',
          'month': 'MM/YYYY',
          'quarter': 'Qo YYYY',
          'year': 'YYYY',
        },
      }
    },

  }, 

  propTypes: {
    ...commonPropTypes,
    width: PropTypes.number,
    height: PropTypes.number,
    series: PropTypes.arrayOf(seriesPropType),
    finished: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    scaleTimeAxis: PropTypes.bool,
  }, 
  
  contextTypes: {
    config: PropTypes.object,
  },

  getDefaultProps: function () {
    return {
      width: 850,
      height: 350,
      series: [],
      finished: true,
      scaleTimeAxis: false,
    };
  },

  render: function () {
    var {defaults} = this.constructor;
    var {field, level, reportName} = this.props;
    
    var {config} = this.context;
    var _config = config.reports.byType.measurements;
    
    var {title, unit} = _config.fields[field];
    
    var {xaxisData, series} = this._consolidateData();
    
    xaxisData || (xaxisData = []);
    
    series = (series || []).map(s => ({
      name: this._getNameForSeries(s),
      symbolSize: 0,
      smooth: false,
      data: s.data,
    }));

    var xf = defaults.xAxis.dateformat[level];

    return (
      <div className="report-chart"
        id={['chart', field, level, reportName].join('--')}
       >
         <echarts.LineChart
            width={this.props.width}
            height={this.props.height}
            loading={this.props.finished? null : {text: 'Loading data...'}}
            tooltip={false}
            lineWidth={2}
            xAxis={{
              data: xaxisData,
              boundaryGap: true, 
              formatter: (t) => (moment(t).format(xf)),
            }}
            yAxis={{
              name: title + (unit? (' (' + unit + ')') : ''),
              numTicks: 4,
              formatter: unit? ((y) => (y.toFixed(1) + ' ' + unit)) : null,
            }}
            series={series}
        />
      </div>
    );
  },

  // Helpers

  _consolidateData: function () {
    var result = {xaxisData: null, series: null};
    var {field, level, reportName, series, scaleTimeAxis} = this.props;
    
    var {config} = this.context;
    var _config = config.reports.byType.measurements;

    if (!series || !series.length || series.every(s => !s.data.length))
      return result; // no data available
    
    var report = _config.levels[level].reports[reportName];
    var {bucket, duration} = config.reports.levels[level];
    var [d, durationUnit] = duration;
    var d = moment.duration(d, durationUnit);

    // Use a sorted (by timestamp t) copy of series data [t,y]
    
    series = series.map(s => (_.extend({}, s, {
      data: s.data.slice(0).sort((p1, p2) => (p1[0] - p2[0])),
    })));

    // Find time span
    
    var start, end;
    if (scaleTimeAxis) {
      start = _.min(series.map(s => s.data[0][0]));
      end = _.max(series.map(s => s.data[s.data.length -1][0]));
    } else {
      start = _.min(series.map(s => s.timespan[0]));
      end = _.max(series.map(s => s.timespan[1]));
    }
    
    var startx = moment(start).startOf(bucket);
    var endx = moment(end).endOf(bucket);
    
    // Generate x-axis data,
    
    result.xaxisData = [];
    for (let m = startx; m < endx; m.add(d)) {
      result.xaxisData.push(m.valueOf());
    }

    // Collect points in level-wide buckets, then consolidate
    
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
      // The last (N-th) bucket will always be empty
      yb.push([]);
      return yb;
    };

    var cf = consolidateFn[report.consolidate]; 
    result.series = series.map(s => (
      _.extend({}, s, {
        data: groupInBuckets(s.data, result.xaxisData).map(cf)
      })
    ));
    
    return result;
  },

  _getNameForSeries: function ({ranking, population: target, metric}) {
    var {nameTemplates} = this.constructor;
    var {config} = this.context;
    
    var label;
    if (target instanceof population.Utility) {
      // Use utility's friendly name
      label = config.utility.name;
    } else if (target instanceof population.ClusterGroup) {
      // Use group's friendly name
      label = config.utility.clusters
        .find(c => (c.key == target.clusterKey))
          .groups.find(g => (g.key == target.key)).name;
    }

    var tpl = (ranking)? nameTemplates.ranking : nameTemplates.basic;
    return tpl({metric, label, ranking});
  },
  
});

var Info = React.createClass({
  
  statics: {},

  propTypes: {
    ...commonPropTypes,
    requested: PropTypes.number,
    finished: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    errors: PropTypes.arrayOf(PropTypes.string),
    series: PropTypes.arrayOf(PropTypes.shape({
      data: PropTypes.array,
    })),
    requests: PropTypes.number,
  },
  
  getDefaultProps: function () {
    return {
      requested: null,
      finished: null,
    };
  },

  shouldComponentUpdate: function (nextProps) {
    if (
      (nextProps.field != this.props.field) || 
      (nextProps.level != this.props.level) ||
      (nextProps.reportName != this.props.reportName)
    )
      return true;
    return _.isNumber(nextProps.finished);
  },

  render: function () {
    var {field, level, reportName} = this.props;
    var {errors, series, requests, requested, finished} = this.props;
    var paragraph, message;
    
    var n = !series? 0 : series.filter(s => (s.data.length > 0)).length; 
    
    if (errors) {
      message = _.first(errors);
      paragraph = (<p className="help text-danger">{message}</p>);
    } else if (!n) {
      message = _.isNumber(finished)? 
        ('No data received! Last attempt was at ' + moment(finished).format('HH:mm:ss')):
        ('No data!');
      paragraph = (<p className="help text-warning">{message}</p>);
    } else {
      message = 'Everything is fine. Updated at ' + moment(finished).format('HH:mm:ss');
      paragraph = ( <p className="help text-muted">{message}</p>);
    }

    return (
      <div className="report-info"
        id={['info', field, level, reportName].join('--')}
       >
        {paragraph}
      </div>
    );
  },
});

//
// Container components
//

var actions = require('../../actions/reports-measurements');

Panel = ReactRedux.connect(
  (state, ownProps) => {
    var {field, level, reportName} = ownProps;
    var _state = state.reports.measurements;
    var key = computeKey(field, level, reportName, REPORT_KEY); 
    return !(key in _state)? {} : 
      _.pick(_state[key], ['source', 'timespan', 'population']);
  }, 
  (dispatch, ownProps) => {
    var {field, level, reportName} = ownProps;
    return {
      initializeReport: (defaults) => (
        dispatch(actions.initialize(field, level, reportName, REPORT_KEY, defaults))),
      setSource: (source) => (
        dispatch(actions.setSource(field, level, reportName, REPORT_KEY, source))),
      setTimespan: (ts) => (
        dispatch(actions.setTimespan(field, level, reportName, REPORT_KEY, ts))),
      setPopulation: (p) => (
        dispatch(actions.setPopulation(field, level, reportName, REPORT_KEY, p))),
      refreshData: () => (
        dispatch(actions.refreshData(field, level, reportName, REPORT_KEY))),
    };
  }
)(Panel);

Chart = ReactRedux.connect(
  (state, ownProps) => {
    var {field, level, reportName} = ownProps;
    var _state = state.reports.measurements;
    var key = computeKey(field, level, reportName, REPORT_KEY); 
    return !(key in _state)? {} : 
      _.pick(_state[key], ['finished', 'series']);
  },
  null
)(Chart);

Info = ReactRedux.connect(
  (state, ownProps) => {
    var {field, level, reportName} = ownProps;
    var _state = state.reports.measurements;
    var key = computeKey(field, level, reportName, REPORT_KEY);
    return !(key in _state)? {} : 
      _.pick(_state[key], ['requested', 'finished', 'requests', 'errors', 'series']
    );
  },
  null
)(Info);

// Export

module.exports = {Panel, Chart, Info};
