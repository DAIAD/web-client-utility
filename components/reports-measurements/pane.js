
var _ = require('lodash');
var moment = require('moment');
var sprintf = require('sprintf');

var React = require('react');
var ReactRedux = require('react-redux');
var Bootstrap = require('react-bootstrap');
var DatetimeInput = require('react-datetime');
var Select = require('react-select').default;
var Switch = require('rc-switch');

var toolbars = require('../toolbars');
var Errors = require('../../constants/Errors');
var Granularity = require('../../model/granularity');
var TimeSpan = require('../../model/timespan');
var population = require('../../model/population');
var { timespanPropType, populationPropType, seriesPropType, configPropType } = require('../../prop-types');
var { equalsPair } = require('../../helpers/comparators');

var Chart = require('./chart');

var { Panel, ListGroup, ListGroupItem, Accordion } = Bootstrap;

var { PropTypes } = React;

const REPORT_KEY = 'pane';
const REPORT_MULTIPLE_KEY = 'pane/multiple';
const MAX_QUERIES = 3;
const LEVEL_OPTIONS =
  [
    { value: 'hour', label: 'hour' },
    { value: 'day', label: 'day' },
    { value: 'week', label: 'week' },
    { value: 'month', label: 'month' },
    { value: 'year', label: 'year' }
  ];

// Todo Move under react-intl
const ErrorMessages = {
  [Errors.reports.measurements.TIMESPAN_INVALID]:
    'The given time range is invalid.',
  [Errors.reports.measurements.TIMESPAN_TOO_NARROW]:
    'The given time range is too narrow.',
  [Errors.reports.measurements.TIMESPAN_TOO_WIDE]:
    'The given time range is too wide.',
};

//
// Helpers
//

var checkTimespan = function (val, level, N = 4) {
  // Check if a timespan (given either as name or as pair of timestamps)
  // is valid. A non-empty string represents an error, zero represents success.

  var [t0, t1] = computeTimespan(val);

  var dt = t1.valueOf() - t0.valueOf();
  if (dt <= 0)
    return Errors.reports.measurements.TIMESPAN_INVALID;

  var dl = Granularity.fromName(level).valueOf();
  if (dl >= dt)
    return Errors.reports.measurements.TIMESPAN_TOO_NARROW;

  if (dl * Math.pow(10, N) < dt)
    return Errors.reports.measurements.TIMESPAN_TOO_WIDE; // N orders of magnitude bigger than dl

  return 0;
};

var computeTimespan = function (val) {
  // Convert to a pair of moment instances
  if (_.isString(val)) {
    return TimeSpan.fromName(val).toRange();
  } else if (_.isArray(val)) {
    var [t0, t1] = val;
    return [moment(t0), moment(t1)];
  }
};

var getDefaultQuery = function (object) {
  var { config } = object.context;
  var defaultPopulation = new population.Utility(config.utility.key, config.utility.name);
  var _config = object.context.config.reports.byType.measurements;
  var defaultTimespan = _config.levels[object.props.level].reports[object.props.reportName].timespan;
  var defaultQuery = {
    id: 0,
    query: {
      timespan: defaultTimespan, population: defaultPopulation
    },
    series: null
  };

  return defaultQuery;
}

var mergeMultipleSeries = function (queries) {
  if (!queries) {
    return [];
  }

  var multipleSeries = [];
  for (var k = 0; k < queries.length; k++) {
    var series = queries[k].series ? queries[k].series : [];
    multipleSeries = multipleSeries.concat(series);
  }
  return multipleSeries;
}

var shapeFavouriteQueries = function (favouriteQueries, config) {

  //var config = config1.config;
  var multipleQueries = [];
  for (let i = 0; i < favouriteQueries.length; i++) {
    var query = {};

    //set id
    query.id = i;

    //set overlapping
    query.overlap = {};
    query.overlap.value = favouriteQueries[i].overlap ? favouriteQueries[i].overlap : null;
    query.overlap.label = favouriteQueries[i].overlap ? favouriteQueries[i].overlap : null;

    query.query = {};

    //construct population 
    var [g] = population.fromString(favouriteQueries[i].population[0].label);
    var [clusterKey, groupKey] = population.extractGroupParams(g);
    if (favouriteQueries[i].population.length === 1) {
      var target;
      if (!clusterKey && !groupKey) {
        target = new population.Utility(config.utility.key, config.utility.name);
      } else if (clusterKey && !groupKey) {
        target = new population.Cluster(clusterKey);
      } else if (!clusterKey && groupKey) {
        target = new population.Group(groupKey);
      } else {
        target = new population.ClusterGroup(clusterKey, groupKey);
      }
      query.query.population = target;
    } else {
      //favourite population contains groups of cluster. Construct the Cluster:
      if (!clusterKey) {
        console.error('Something went wrong. Malformed favourite population');
        target = new population.Utility(config.utility.key, config.utility.name);
      }
      query.query.population = new population.Cluster(clusterKey);
    }

    //construct timespan
    query.query.timespan = [favouriteQueries[i].time.start, favouriteQueries[i].time.end];
    multipleQueries.push(query);
  }

  return multipleQueries;
}

var getTags = function (obj) {
  var source = obj.props.source;
  var level = obj.props.level;
  var queries = obj.props.multipleQueries;
  var time = '';
  var populationTag = '';

  for (let n = 0; n < queries.length; n++) {
    if (queries[n].query.population.name) {
      populationTag += '/' + queries[n].query.population.name;
    } else if (queries[n].query.population.type) {
      populationTag += '/' + queries[n].query.population.type;
    } else {
      populationTag += '/Cluster';
    }
  }

  if (obj.state.overlapping) {
    var maxDuration = 0;

    for (let k = 0; k < queries.length; k++) {
      var start1 = moment(queries[k].query.timespan[0]);
      var end1 = moment(queries[k].query.timespan[1]);
      var diff = moment(end1, "DD/MM/YYYY HH:mm:ss").diff(start1, "DD/MM/YYYY HH:mm:ss");
      if (diff < 0) {
        console.error('Invalid timespan');
      }
      if (diff > maxDuration) {
        maxDuration = diff;
      }
    }
    time = 'Overlap ' + moment.duration(maxDuration).humanize();

  } else {

    var q1t = computeTimespan(obj.props.multipleQueries[0].query.timespan);
    var q2t = computeTimespan(obj.props.multipleQueries[obj.props.multipleQueries.length - 1].query.timespan);
    var start = q1t[0].format("DD/MM/YYYY");
    var end = q2t[1].format("DD/MM/YYYY");
    time = start + ' to ' + end;
  }
  return 'Chart - ' + source + ' - ' + time + ' - ' + 'Level: ' + level + ' - ' + populationTag;
}

const optionRenderer = (o) => {
  if (o.header) {
    return (<div className="text-muted" style={{ fontSize: '0.8em' }}>{o.label}</div>);
  }
  return (<div>{o.label}</div>);
}

//
// Presentational components
//

var FormStatusParagraph = ({ errorMessage, dirty }) => {
  if (errorMessage) {
    return (<p className="help text-danger">{errorMessage}</p>);
  } else if (dirty) {
    return (<p className="help text-info">Parameters have changed. Refresh to redraw data!</p>);
  } else {
    return (<p className="help text-muted">Refresh to redraw data.</p>);
  }
};

var ReportPanel = React.createClass({
  statics: {
    nameTemplates: {
      basic: _.template('<%= metric %> of <%= label %>'),
      ranking: _.template('<%= ranking.type %>-<%= ranking.index + 1 %> of <%= label %>'),
    },
    defaults: {
      datetimeInputProps: {
        closeOnSelect: true,
        dateFormat: 'ddd D MMM[,] YYYY',
        timeFormat: null,
        inputProps: { size: 10 },
      },

      helpMessages: {
        'favourite': 'Open favourite settings for this chart.',
        'source': 'Specify the source device for measurements.',
        'population-group': 'Target a group (or cluster of groups) of consumers.',
        'timespan': 'Specify the time range you are interested into.',
        'report-name': 'Select the metric to be applied to measurements.',
        'level': 'Specify the level of detail (unit of time for charts).',
        'overlap': 'Switch to overlapping time series'
      },

      chartProps: {
        width: 780,
        height: 300,
      },
    },

    templates: {
      reportTitle: _.template('<%= report.title %> - <%= populationName %>'),
    },

    configForReport: function (props, { config }) {
      return config.reports.byType.measurements
        .levels[props.level]
        .reports[props.reportName];
    },

    toolbarSpec: [
      {
        key: 'shared-parameters',
        //component: 'div', // Note default is Bootstrap.ButtonGroup
        buttons: [
          {
            key: 'favourite',
            tooltip: { message: 'Favourite settings', placement: 'bottom' },
            iconName: 'star-o',
            //text: 'Favourite',
            buttonProps: { bsStyle: 'default', /*className: 'btn-circle'*/ },
          },
          {
            key: 'source',
            tooltip: { message: 'Select source of measurements', placement: 'bottom' },
            iconName: 'cube',
            //text: 'Source',
            buttonProps: { bsStyle: 'default', /*className: 'btn-circle'*/ },
          },
          {
            key: 'report',
            tooltip: { message: 'Choose type of report', placement: 'bottom' },
            iconName: 'area-chart',
            //text: 'Metric',
            buttonProps: { bsStyle: 'default', /*className: 'btn-circle'*/ },
          },
        ],
      },
      {
        key: 'actions',
        //component: 'div', // Note default is Bootstrap.ButtonGroup
        buttons: [
          {
            key: 'export',
            tooltip: { message: 'Export to a CSV table', placement: 'bottom' },
            text: 'Export',
            iconName: 'table',
            buttonProps: { disabled: true, bsStyle: 'default', /*className: 'btn-circle'*/ },
          },
          {
            key: 'refresh',
            tooltip: { message: 'Re-generate report and redraw the chart', placement: 'bottom' },
            text: 'Refresh',
            iconName: 'refresh',
            buttonProps: { bsStyle: 'primary', /*className: 'btn-circle'*/ },
          },
          {
            key: 'add',
            tooltip: { message: 'Add additional series', placement: 'bottom' },
            iconName: 'plus',
            text: 'Add Series',
            buttonProps: { bsStyle: 'default', /*className: 'btn-circle'*/ },
          },
        ],
      },
    ],
    parameters: [
      {
        key: 'query-parameters',
        buttons: [
          {
            key: 'timespan',
            tooltip: { message: 'Define a time range', placement: 'bottom' },
            iconName: 'calendar',
            buttonProps: { bsStyle: 'default' },
          },
          {
            key: 'population-group',
            tooltip: { message: 'Define a population target', placement: 'bottom' },
            iconName: 'users',
            buttonProps: { bsStyle: 'default' },
          }
        ],
      },
    ],
  },

  propTypes: {
    // Model
    field: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    level: PropTypes.string.isRequired,
    reportName: PropTypes.string.isRequired,
    source: PropTypes.string,
    timespan: timespanPropType,
    population: populationPropType,
    finished: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    series: PropTypes.arrayOf(seriesPropType),

    // Funcs (dispatchers)
    initializeReport: PropTypes.func.isRequired,
    refreshData: PropTypes.func.isRequired,
    setReport: PropTypes.func.isRequired,
    setField: PropTypes.func.isRequired,
    setTimespan: PropTypes.func.isRequired,
    setPopulation: PropTypes.func.isRequired,
    setSource: PropTypes.func.isRequired,

    // Appearence
    fadeIn: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.shape({
        className: PropTypes.string, // class to apply to fade-in elements
        duration: PropTypes.number, // the duration of fade-in animation (seconds)
      })
    ]),
  },

  contextTypes: { config: configPropType },

  // Lifecycle

  getInitialState: function () {
    return {
      draw: true,
      fadeIn: false, // animation effect in progress
      dirty: false,
      timespan: this.props.timespan,
      error: null,
      formFragment: 'report',
      parameterFragment: 'timespan',
      disabledButtons: '', // a '|' delimited string, e.g 'export|refresh',
      panelChanged: true,
      overlapping: false,
      viewMode: 'days',
      pickerOpen: false,
      overlapTimespan: null
    };
  },

  getDefaultProps: function () {
    return {
      field: 'volume',
      level: 'week',
      reportName: null,
      source: null,
      timespan: null,
      population: null,
      finished: null,
      fadeIn: false, // {className: 'fade-in', duration: 0.5},
      defaultFavouriteValues: {
        timespan: false,
        source: false,
        population: false,
        metricLevel: false
      },
      multipleQueries: [],
      overlap: { value: 'day', label: 'day' },
      overlapping: false
    };
  },

  componentWillMount: function () {
    //initializing favourite view (if editing favourite)
    if (this.props.favouriteChart && this.props.favouriteChart.type == 'CHART') {
      if (this.props.favouriteChart.overlap) {
        var overlap = { value: this.props.favouriteChart.overlap, label: this.props.favouriteChart.overlap };
        this.setState({ overlapping: true });
        this._setOverlap(overlap);
      }
      this.props.initMultipleQueries(
        this.props.favouriteChart.field, this.props.favouriteChart.level,
        this.props.favouriteChart.reportName,
        shapeFavouriteQueries(this.props.favouriteChart.queries, this.context.config), this.props.favouriteChart.queries[0].source);
    }
  },
  componentDidMount: function () {

    var { field, level, reportName } = this.props;

    if (_.isEmpty(field) || _.isEmpty(level) || _.isEmpty(reportName)) {
      return; // cannot yet initialize the target report
    }

    if (!(this.props.favouriteChart && this.props.favouriteChart.type == 'CHART')) {
      var defaultQuery = getDefaultQuery(this);
      this.props.initMultipleQueries(field, level, reportName, [defaultQuery], null);

    }
    this.props.refreshMultipleData(field, level, reportName).then(() => (this.setState({ draw: true })));
  },

  componentWillReceiveProps: function (nextProps, nextContext) {

    // In any case, reset temporary copy of timespan, clear error/dirty flags
    this.setState({
      error: null,
      timespan: nextProps.timespan,
    });

    // If moving to another report, take care to initialize it first
    if (
      (nextProps.field != this.props.field) ||
      (nextProps.level != this.props.level) ||
      (nextProps.reportName != this.props.reportName)
    ) {
      // console.log(sprintf(
      //   'The panel will switch to report (%s, %s, %s)',
      //   nextProps.field, nextProps.level, nextProps.reportName
      // ));
      console.assert(nextContext.config == this.context.config,
        'Unexpected change for configuration in context!');

      if (this.props.multipleQueries.length > 0) {
        nextProps.initMultipleQueries(
          nextProps.field, nextProps.level, nextProps.reportName, this.props.multipleQueries, null
        );
      } else {
        if (this.props.favouriteQuery) {
          nextProps.initMultipleQueries(
            this.props.favouriteQuery.field, this.props.favouriteQuery.level,
            this.props.favouriteQuery.reportName,
            shapeFavouriteQueries(this.props.favouriteQuery.queries, this.context.config), this.props.favouriteQuery.queries[0].source
          );
        } else {
          nextProps.initMultipleQueries(
            nextProps.field, nextProps.level, nextProps.reportName, [getDefaultQuery], null
          );
        }
      }

      setTimeout(
        () => (nextProps.refreshMultipleData(
          nextProps.field, nextProps.level, nextProps.reportName)
        ),
        100
      );
    }
  },

  shouldComponentUpdate: function (nextProps, nextState) {
    // Suppress some (rather expensive) updates

    if (this.state.panelChanged) {
      return true;
    }

    var changedProps, changedState;
    var ignoredNextState = {
      draw: false, // i.e changed true -> false (a drawing request was fullfilled)
    };

    changedProps = _.differenceWith(
      _.toPairs(nextProps), _.toPairs(this.props), equalsPair
    );
    if (changedProps.length > 0)
      return true; // always update on incoming props

    changedState = _.differenceWith(
      _.toPairs(nextState), _.toPairs(this.state), equalsPair
    );
    changedState = _.differenceWith(
      changedState, _.toPairs(ignoredNextState), equalsPair
    );

    // if (changedState.length == 0) console.info('Skipping update of <ReportPanel>');
    return (changedState.length > 0);
  },

  componentDidUpdate: function () {
    // The component has successfully updated

    // Check if redrawing or just redrawn
    if (this.state.draw) {
      var nextState = { dirty: false };
      if (_.isNumber(this.props.finished))
        nextState.draw = false; // next drawing will happen only on-demand
      this.setState(nextState);
    }

    // If under a CSS animation, remember to clear the flag after the animation has ended.
    // This is needed, because only a change "" -> ".fade-in" can trigger a new animation.
    if (this.state.fadeIn) {
      setTimeout(
        () => (this.state.fadeIn && this.setState({ fadeIn: false })),
        (this.props.fadeIn.duration + 0.25) * 1e+3
      );
    }
    this.setState({ panelChanged: false });
  },

  render: function () {
    var { defaults } = this.constructor;
    var { dirty, draw, error } = this.state;

    var { field, title, level, reportName, finished } = this.props;
    var series = this.props.series2;

    var toolbarSpec = this._specForToolbar();
    var parameters = this._specForParameters();
    var header = (
      <div className="header-wrapper">
        <h3>{title}</h3>
        <toolbars.ButtonToolbar className="header-toolbar"
          groups={toolbarSpec}
          onSelect={this._handleToolbarEvent}
        />
      </div>
    );

    var footer = (
      <ReportInfo
        field={field}
        level={level}
        reportName={reportName}
        requested={this.props.requested}
        series={mergeMultipleSeries(this.props.multipleQueries)}
        finished={this.props.finished} />
    );

    var formFragment = this._renderFormFragment();

    var parameterFragment;
    if (this.props.multipleQueries.length > 0) {
      parameterFragment = this._renderParameterFragment(this.props.multipleQueries[0]);
    } else {
      parameterFragment = this._renderParameterFragment(getDefaultQuery(this));
    }

    var reportTitle = this._titleForReport();

    var multipleSeries = [];
    var queryTitle = this.props.multipleQueries[0] ? this.getNameForQuery(0) : 'Default Series';
    var defaultTitle = (
      <span style={{ paddingLeft: 4 }} >
        {queryTitle}
      </span>
    );

    multipleSeries.push(
      <Panel key={0} header={defaultTitle} eventKey={0}>
        <form className="report-form form-horizontal">
          <fieldset className={!this.state.fadeIn ? '' : this.props.fadeIn.className}>
            {parameterFragment}
          </fieldset>
        </form>
        <toolbars.ButtonToolbar className="header-toolbar"
          groups={parameters}
          onSelect={this._handleToolbarEvent}
        />
      </Panel>
    );

    for (var i = 1; i < this.props.multipleQueries.length; i++) {
      parameterFragment = this._renderParameterFragment(this.props.multipleQueries[i]);
      var multipleSerieTitle = (
        <span>
          <span>
            <span style={{ paddingLeft: 4 }}>{this.props.multipleQueries[i] ? this.getNameForQuery(i) : 'Series ' + i}</span>
          </span>
          <span style={{ float: 'right', marginTop: -3, marginLeft: 5 }}>
            <Bootstrap.Button
              eventKey={i}
              bsStyle='default'
              className='btn-circle'
              onClick={this._removeSeries.bind(this, this.props.multipleQueries[i].id)}>
              <i className='fa fa-remove fa-fw'></i>
            </Bootstrap.Button>
          </span>
        </span>
      );

      multipleSeries.push(
        <Panel key={i} header={multipleSerieTitle} eventKey={i}>
          <form className="report-form form-horizontal">
            <fieldset className={!this.state.fadeIn ? '' : this.props.fadeIn.className}>
              {parameterFragment}
            </fieldset>
          </form>
          <toolbars.ButtonToolbar className="header-toolbar"
            groups={parameters}
            onSelect={this._handleToolbarEvent}
          />
        </Panel>
      );
    }

    series = mergeMultipleSeries(this.props.multipleQueries);

    return (
      <Panel header={header} footer={footer}>
        <ListGroup fill>
          <ListGroupItem className="report-form-wrapper">
            <form className="report-form form-horizontal">
              <fieldset className={!this.state.fadeIn ? '' : this.props.fadeIn.className}>
                {formFragment}
              </fieldset>
            </form>
            <div>
              <Accordion>
                {multipleSeries}
              </Accordion>
            </div>
          </ListGroupItem>
          <ListGroupItem className="report-form-help report-title-wrapper">
            <h4>{reportTitle}</h4>
            <FormStatusParagraph
              dirty={dirty} errorMessage={!error ? null : ErrorMessages[error]}
            />
          </ListGroupItem>
          <ListGroupItem className="report-chart-wrapper">
            <Chart
              {...defaults.chartProps}
              draw={draw}
              field={field}
              level={level}
              reportName={reportName}
              finished={finished}
              series={series}
              overlap={this.props.overlap}
              overlapping={this.state.overlapping}
            />
          </ListGroupItem>
        </ListGroup>
      </Panel>
    );
  },

  getNameForQuery: function (i) {
    var query = this.props.multipleQueries[i].query;
    var target = query.population;
    var timeLabel = _.isString(query.timespan) ? query.timespan :
      moment(query.timespan[0]).format('DD/MMM/YYYY') + ' - ' + moment(query.timespan[1]).format('DD/MMM/YYYY');

    var { config } = this.context;
    var label, cluster;
    if (target instanceof population.Utility) {
      // Use utility's friendly name
      label = 'Utility';
    } else if (target instanceof population.ClusterGroup) {
      // Use group's friendly name
      cluster = config.utility.clusters.find(c => (c.key == target.clusterKey));
      label = cluster.name + ': ' + cluster.groups.find(g => (g.key == target.key)).name;
    } else if (target instanceof population.Cluster) {
      cluster = config.utility.clusters.find(k => (k.key == target.key));
      label = cluster.name;
    }
    return label + ': ' + timeLabel; //todo - consider shorter time label
  },

  // Event handlers

  _handleToolbarEvent: function (groupKey, key) {
    switch (groupKey) {
      case 'shared-parameters':
        return this._switchToFormFragment(key);
      case 'query-parameters':
        return this._switchToParameterFragment(key);
      case 'actions':
        return this._performAction(key);
    }
  },

  _switchToFormFragment: function (key) {
    if (this.state.formFragment != key) {
      var nextState = { formFragment: key };
      if (this.props.fadeIn)
        nextState.fadeIn = true;
      this.setState(nextState);
    }
    return false;
  },
  _switchToParameterFragment: function (key) {

    if (this.state.parameterFragment != key) {
      var nextState = { parameterFragment: key };
      if (this.props.fadeIn)
        nextState.fadeIn = true;
      this.setState(nextState);
    }
    return false;
  },
  _performAction: function (key) {
    var { field, level, reportName } = this.props;
    switch (key) {
      case 'refresh':
        {
          // console.debug(sprintf(
          //   'About to refresh data for report (%s, %s, %s)...',
          //   field, level, reportName
          // ));
          this.props.refreshMultipleData(field, level, reportName);
          this.setState({ draw: true });
        }
        break;
      case 'export':
        // Todo
        break;
      case 'add':
        var { multipleQueries } = this.props;

        var cls = this.constructor;
        var { timespan } = cls.configForReport(this.props, this.context);
        var popul = multipleQueries[multipleQueries.length - 1].query.population;
        var lastId = multipleQueries[multipleQueries.length - 1].id;
        var queryTemp = {};
        queryTemp.id = lastId + 1;

        queryTemp.query = {
          timespan: timespan,
          population: popul
        };

        queryTemp.series = null;

        var newMult = this.props.multipleQueries;
        newMult.push(queryTemp);
        this.props.addQuery(newMult);

        if (this.props.multipleQueries.length == MAX_QUERIES) {
          this.setState({ disabledButtons: 'add', dirty: true, panelChanged: true });
        } else {
          this.setState({ disabledButtons: '', dirty: true, panelChanged: true });
        }
        break;
    }
  },
  _removeSeries: function (i) {
    var newMults = this.props.multipleQueries.filter(function (obj) {
      return obj.id !== i;
    });

    this.props.removeSeries(newMults);
    this.setState({ panelChanged: true });
    if (this.props.multipleQueries.length == MAX_QUERIES) {
      this.setState({ disabledButtons: '' });
    }
  },

  _setSource: function (source) {
    //this.props.defaultFavouriteValues.source = false;
    this.props.setQuerySource(source.value);

    this.setState({ dirty: true });
    return false;
  },

  _setReport: function (level, reportName) {
    //this.props.defaultFavouriteValues.metricLevel = false;

    this.props.setReport(level, reportName);
    this.setState({ dirty: true });
    return false;
  },

  _setField: function (field) {
    this.props.setField(field);
    this.setState({ dirty: true });
    return false;
  },

  _setTimespan: function (value) {

    //this.props.defaultFavouriteValues.timespan = false;

    var error = null, timespan = null;

    // Validate
    if (_.isString(value)) {
      // Assume a symbolic name is always valid
      timespan = value;
    } else if (_.isArray(value)) {
      // Check if given timespan is a valid range
      var [t0, t1] = value;
      console.assert(moment.isMoment(t0) && moment.isMoment(t1),
        'Expected a pair of moment instances');
      error = checkTimespan(value, this.props.level);
      if (!error) {
        // Truncate the time part, we only care about integral days!
        t0.millisecond(0).second(0).minute(0).hour(0);
        t1.millisecond(0).second(0).minute(0).hour(0);
        // Make a pair of timestamps to dispatch upstairs
        timespan = [t0.valueOf(), t1.valueOf()];
      }
    }

    // If valid, invoke setTimespan()
    if (!error) {
      var { field, level, reportName } = this.props;
      this.props.setTimespan(field, level, reportName, timespan);
    }

    // Update state with (probably invalid) timespan (to keep track of user input)
    this.setState({ dirty: true, timespan: value, error });
    return false;
  },

  //set overlapping timespan for current query
  _setQueryOverlappingTimespan: function (value, query) {

    var queryTimespan, overlapTimespan;
    if (this.state.overlapping) {
      switch (this.state.viewMode) {
        case 'years':
          queryTimespan = [value[0].valueOf(), moment(value[0]).add(1, 'year').valueOf()];
          overlapTimespan = value[0].format('YYYY');
          break;
        case 'months':
          queryTimespan = [value[0].valueOf(), moment(value[0]).add(1, 'month').valueOf()];
          overlapTimespan = value[0].format('MMM YYYY');
          break;
        case 'days':
          queryTimespan = [value[0].valueOf(), moment(value[0]).add(1, 'day').valueOf()];
          overlapTimespan = value[0].format('DD MMM YYYY');
          break;
      }
    } else {
      console.error('Setting overlap, but overlapping is disabled!');
    }

    var mq = this.props.multipleQueries;
    if (mq.length > 0) {
      for (var i in mq) {
        if (mq[i].id == query.id) {
          mq[i].query.timespan = queryTimespan;
        }
      }
    } else {
      var q = getDefaultQuery(this);
      q.query.timespan = queryTimespan;
      mq = [q];
    }

    this.props.changeMultipleQueries(mq);

    var error = null;

    // Update state with (probably invalid) timespan (to keep track of user input)
    this.setState({ dirty: true, timespan: value, error, panelChanged: true, pickerOpen: false, overlapTimespan: overlapTimespan });
    return false;
  },
  //set timespan for current query
  _setQueryTimespan: function (value, query) {

    var error = null, queryTimespan = null;

    // Validate
    if (_.isString(value)) {
      // Assume a symbolic name is always valid
      queryTimespan = value;
    } else if (_.isArray(value)) {
      // Check if given timespan is a valid range
      var [t0, t1] = value;
      console.assert(moment.isMoment(t0) && moment.isMoment(t1),
        'Expected a pair of moment instances');
      error = checkTimespan(value, this.props.level);
      if (!error) {
        // Truncate the time part, we only care about integral days!
        t0.millisecond(0).second(0).minute(0).hour(0);
        t1.millisecond(0).second(0).minute(0).hour(0);
        // Make a pair of timestamps to dispatch upstairs
        queryTimespan = [t0.valueOf(), t1.valueOf()];
      }
    }

    var mq = this.props.multipleQueries;

    if (mq.length > 0) {
      for (var i in mq) {
        if (mq[i].id == query.id) {
          mq[i].query.timespan = queryTimespan;
        }
      }
    } else {
      var q = getDefaultQuery(this);
      q.query.timespan = queryTimespan;
      mq = [q];
    }

    // If valid, change timespan of selected query
    if (!error) {
      this.props.changeMultipleQueries(mq);
    }

    // Update state with (probably invalid) timespan (to keep track of user input)
    this.setState({ dirty: true, timespan: value, error, panelChanged: true });
    return false;
  },

  _setPopulation: function (clusterKey, groupKey) {

    //this.props.defaultFavouriteValues.population = false;

    var { field, level, reportName } = this.props;
    var { config } = this.context;

    var target;
    if (!clusterKey && !groupKey) {
      target = new population.Utility(config.utility.key, config.utility.name);
    } else if (clusterKey && !groupKey) {
      target = new population.Cluster(clusterKey);
    } else if (!clusterKey && groupKey) {
      target = new population.Group(groupKey);
    } else {
      target = new population.ClusterGroup(clusterKey, groupKey);
    }

    this.props.setPopulation(field, level, reportName, target);
    this.setState({ dirty: true });
    return false;
  },

  _setQueryPopulation: function (clusterKey, groupKey, query) {

    var { config } = this.context;

    var target;
    if (!clusterKey && !groupKey) {
      target = new population.Utility(config.utility.key, config.utility.name);
    } else if (clusterKey && !groupKey) {
      target = new population.Cluster(clusterKey);
    } else if (!clusterKey && groupKey) {
      target = new population.Group(groupKey);
    } else {
      target = new population.ClusterGroup(clusterKey, groupKey);
    }

    var mq = this.props.multipleQueries;

    for (var i in mq) {
      if (mq[i].id == query.id) {
        mq[i].query.population = target;
      }
    }
    this.props.changeMultipleQueries(mq);
    this.setState({ dirty: true, panelChanged: true });
    return false;
  },

  // Helpers

  _renderFormFragment: function () {
    var { defaults } = this.constructor;
    var { helpMessages } = defaults;
    var { config } = this.context;
    var { levels } = config.reports.byType.measurements;
    var overlap = config.reports.overlap.values;
    delete overlap.week; //excluding week from overlap options

    var { level } = this.props;
    var fragment1; // single element or array of keyed elements
    switch (this.state.formFragment) {
      case 'favourite':
        var favouriteButtonText = this.props.favouriteChart ? 'Update Favourite' : 'Add Favourite';
        {
          //Calculate tags
          var tags = getTags(this);

          var enableHelpText = this.state.dirty ? 'Refresh to enable saving.' : '';
          fragment1 = (
            <div>
              <div className='col-md-3'>
                <input id='label' name='favourite' type='favourite' ref='favourite' autoFocus
                  defaultValue={this.props.favouriteChart ? this.props.favouriteChart.title : null}
                  placeholder='Label ...' className='form-control' style={{ marginBottom: 15 }} />
                <span className='help-block'>Insert a label for this favourite</span>
              </div>
              <div className='col-md-6'>
                <input id='name' name='name' type='name' ref='name' autoFocus disabled
                  placeholder={tags} className='form-control' style={{ marginBottom: 15 }} />
                <span className='help-block'>Auto-generated Identifier</span>
              </div>
              <div className='col-md-3'>
                <Bootstrap.Button
                  onClick={this._clickedAddFavourite}
                  bsStyle='success' disabled={this.state.dirty}>
                  {favouriteButtonText}
                </Bootstrap.Button>
                <span className='help-block'>{enableHelpText}</span>
              </div>
            </div>
          );
        }
        break;
      case 'source':
        {
          var { source } = this.props.defaultFavouriteValues.source ? this.props.favouriteChart.queries[0].source : this.props;
          if (source.toUpperCase() === 'AMPHIRO' || source.toUpperCase() === 'DEVICE') {
            source = 'device';
          } else if (source.toUpperCase() === 'METER') {
            source = 'meter'
          }
          fragment1 = (
            <div className="form-group">
              <label className="col-sm-2 control-label">Source:</label>
              <div className="col-sm-4">
                <Select className="select-source"
                  value={source}
                  options={[
                    { value: 'meter', label: 'Meter (SWM)' },
                    { value: 'device', label: 'Device (B1)' }
                  ]}
                  searchable={false}
                  clearable={false}
                  onChange={this._setSource}
                />
                <p className="help text-muted">{helpMessages['source']}</p>
              </div>
            </div>
          );
        }
        break;
      case 'report':
        {
          var { reportName } = this.props;
          var overlapOptions = Object.keys(overlap).map(function (key) {
            return { value: key, label: overlap[key].name };
          });

          var reportOptions2 = Object.keys(levels[level].reports).map(function (key) {
            return { value: key, label: levels[level].reports[key].title };
          });

          level = this.props.defaultFavouriteValues.metricLevel ? this.props.favouriteChart.level : level;

          fragment1 = [
            (
              <div key="level" className="form-group" >
                <label className="col-sm-2 control-label">Level:</label>
                <div className="col-sm-3">
                  <Select className="select-level"
                    value={level}
                    options={LEVEL_OPTIONS}
                    onChange={(val) => this._setReport(val.value, reportName)}
                    clearable={false}
                    searchable={false}
                  />
                  <div className="col-sm-12">
                    <p className="help text-muted">{helpMessages['level']}</p>
                  </div>
                </div>
              </div>
            ), (
              <div key="report-name" className="form-group" >
                <label className="col-sm-2 control-label">Metric:</label>
                <div className="col-sm-4">
                  <Select className="select-report"
                    value={reportName}
                    options={reportOptions2}
                    onChange={(val) => this._setReport(level, val.value)}
                    clearable={false}
                    searchable={false}
                  />
                  <p className="help text-muted">{helpMessages['report-name']}</p>
                </div>
              </div>
            ),
            (
              <div key="overlap" className="form-group">
                <label className="col-sm-2 control-label">Time Overlap:</label>
                <div className="col-sm-4">
                  <Select name='select-overlap'
                    value={this.props.overlap || 'UNDEFINED'}
                    options={overlapOptions}
                    disabled={!this.state.overlapping}
                    clearable={false}
                    searchable={false}
                    onChange={this._setOverlap}
                  />
                  <p className="help text-muted">{helpMessages['overlap']}</p>
                </div>
                <div className="col-sm-2">
                  <Switch className="col-sm-2" style={{ marginTop: 7 }}
                    onChange={this._handleOverlapSwitchChange}
                    checked={this.state.overlapping}
                  />
                </div>
              </div>
            )
          ];
        }
        break;
      default:
        console.error(sprintf(
          'Got unexpected key (%s) representing a form fragment',
          this.state.formFragment
        ));
        break;
    }

    return fragment1;
  },

  _handleOverlapSwitchChange: function () {
    var mq = this.props.multipleQueries;

    for (let j = 0; j < mq.length; j++) {
      var queryTimespan;
      var query = mq[j].query;

      var qTime = _.isString(query.timespan) ? computeTimespan(query.timespan)[0] : moment(query.timespan[0]);

      switch (this.props.overlap.value) {
        case 'year':
          queryTimespan = [qTime.valueOf(), moment(qTime).add(1, 'year').valueOf()];
          break;
        case 'month':
          queryTimespan = [qTime.valueOf(), moment(qTime).add(1, 'month').valueOf()];
          break;
        case 'day':
          queryTimespan = [qTime.valueOf(), moment(qTime).add(1, 'day').valueOf()];
          break;
      }

      mq[j].query.timespan = queryTimespan;
    }

    this.props.changeMultipleQueries(mq);
    this.setState({ dirty: true, overlapping: !this.state.overlapping })
  },

  _setOverlap: function (value) {
    this.props.setOverlap(value);
    var mq = this.props.multipleQueries;

    for (let j = 0; j < mq.length; j++) {
      var queryTimespan;
      var query = mq[j].query;

      var qTime = _.isString(query.timespan) ? computeTimespan(query.timespan)[0] : moment(query.timespan[0]);

      switch (value.value) {
        case 'year':
          queryTimespan = [qTime.valueOf(), moment(qTime).add(1, 'year').valueOf()];
          break;
        case 'month':
          queryTimespan = [qTime.valueOf(), moment(qTime).add(1, 'month').valueOf()];
          break;
        case 'day':
          queryTimespan = [qTime.valueOf(), moment(qTime).add(1, 'day').valueOf()];
          break;
      }

      mq[j].query.timespan = queryTimespan;
    }

    this.props.changeMultipleQueries(mq);

    var vm = value.value + 's'; //adding 's' to feed datePicker options

    this.setState({ dirty: true, panelChanged: true, viewMode: vm });
  },

  _renderParameterFragment: function (query) {

    var { defaults } = this.constructor;
    var { helpMessages } = defaults;
    var { config } = this.context;
    var { level } = this.props;
    var fragment1; // single element or array of keyed elements
    switch (this.state.parameterFragment) {
      case 'timespan':
        {
          var { timespan } = query.query;
          var [t0, t1] = computeTimespan(timespan);

          if (timespan == null) {
            break;
          }

          var datetimeProps = _.merge({}, defaults.datetimeInputProps, {
            inputProps: {
              disabled: _.isString(timespan) ? 'disabled' : null
            },
          });

          //todo - At custom select put a single reference time for year
          var timespanOptions = new Map(
            Array.from(TimeSpan.common.entries())
              .map(([k, u]) => ([k, u.title]))
              .filter(([k, u]) => checkTimespan(k, level) === 0)
          );

          timespanOptions.set('', 'Custom...');

          var viewTimespan = _.isString(timespan) ? t0 : timespan[0];

          var overlapTimespan;
          switch (this.state.viewMode) {
            case 'years':
              overlapTimespan = moment(viewTimespan).format('YYYY');
              break;
            case 'months':
              overlapTimespan = moment(viewTimespan).format('MMM YYYY');
              break;
            case 'days':
              overlapTimespan = moment(viewTimespan).format('DD MMM YYYY');
              break;
          }

          if (this.state.overlapping) {
            fragment1 = (
              <div className="form-group">
                <label className="col-sm-2 control-label">Overlap Time:</label>
                <div className="col-sm-4">
                  <DatetimeInput
                    closeOnSelect={true}
                    open={this.state.pickerOpen}
                    //isValidDate - todo - restrict user to selected bucket (disable dates not)
                    dateFormat={'MMM[,] YYYY'}
                    timeFormat={false}
                    viewMode={this.state.viewMode}
                    value={overlapTimespan}
                    onChange={(val) => (this._setQueryOverlappingTimespan([val, t1], query))}
                  />
                  <p className="help text-muted">{helpMessages['timespan']}</p>
                </div>
              </div>
            );
          } else {
            fragment1 = (
              <div className="form-group">
                <label className="col-sm-2 control-label">Time:</label>
                <div className="col-sm-9">
                  <Select className="select-timespan"
                    value={_.isString(timespan) ? timespan : ''}
                    options={Array.from(timespanOptions.entries()).map(([k, v]) => ({ value: k, label: v }))}
                    searchable={false}
                    clearable={false}
                    onChange={(o) => (this._setQueryTimespan(o && o.value ? (o.value) : ([t0, t1]), query))}
                  />
                  &nbsp;&nbsp;
                  <DatetimeInput {...datetimeProps}
                    value={t0.toDate()}
                    onChange={(val) => (this._setQueryTimespan([val, t1], query))}
                  />
                  &nbsp;-&nbsp;
                  <DatetimeInput {...datetimeProps}
                    value={t1.toDate()}
                    onChange={(val) => (this._setQueryTimespan([t0, val], query))}
                  />
                  <p className="help text-muted">{helpMessages['timespan']}</p>
                </div>
              </div>
            );
          }
        }
        break;
      case 'population-group':
        {
          var target = query.query.population;
          var { clusters } = config.utility;

          var clusterOptions = [
            { value: '', label: 'None', header: false },
            { value: 'Cluster By', label: 'Cluster By:', header: true, disabled: true },
            ..._.sortBy(clusters, ['name']).map(c => ({ value: c.key, label: c.name, header: false })),
          ];
          var [clusterKey, groupKey] = population.extractGroupParams(target);

          var selectedCluster = !clusterKey ? null : clusters.find(c => (c.key == clusterKey));

          var groupOptions = clusterKey ?
            [
              { value: 'group-1', label: 'All groups', header: true, disabled: true },
              { value: '', label: 'All', header: false },
              { value: 'group-2', label: 'Pick a specific group:', header: true, disabled: true },
              ...selectedCluster.groups.map(g => ({ value: g.key, label: selectedCluster.name + ': ' + g.name, header: false })),
            ] : [
              { value: 'group-1', label: 'No groups', header: true, disabled: true },
              { value: '', label: 'Everyone', header: false },
            ];

          fragment1 = (
            <div className="form-group">
              <label className="col-sm-2 control-label">Group:</label>
              <div className="col-sm-9">
                <Select className="select-cluster"
                  value={clusterKey || ''}
                  options={clusterOptions}
                  searchable={false}
                  clearable={false}
                  onChange={(o) => this._setQueryPopulation(o.value, null, query)}
                  optionRenderer={optionRenderer}
                />
                &nbsp;&nbsp;
                <Select className="select-cluster-group"
                  value={groupKey || ''}
                  options={groupOptions}
                  searchable={false}
                  clearable={false}
                  onChange={(o) => this._setQueryPopulation(clusterKey, o.value, query)}
                  optionRenderer={optionRenderer}
                />
                <p className="help text-muted">{helpMessages['population-group']}</p>
              </div>
            </div>
          );
        }
        break;
      default:
        console.error(sprintf(
          'Got unexpected key (%s) representing a form fragment',
          this.state.parameterFragment
        ));
        break;
    }
    return fragment1;
  },

  _enableButton: function (key, flag = true) {
    var { disabledButtons: value } = this.state, nextValue = null;
    var disabledKeys = value ? value.split('|') : [];
    var i = disabledKeys.indexOf(key);

    if (flag && (i >= 0)) {
      // The button is currently disabled and must be enabled
      disabledKeys.splice(i, 1);
      nextValue = disabledKeys.join('|');
    } else if (!flag && (i < 0)) {
      // The button is currently enabled and must be disabled
      disabledKeys.push(key);
      nextValue = disabledKeys.sort().join('|');
    }

    if (nextValue != null)
      this.setState({ disabledButtons: nextValue });
  },

  _clickedAddFavourite: function () {

    var { config } = this.context;
    var { levels } = config.reports.byType.measurements;
    var report = levels[this.props.level].reports[this.props.reportName];

    var queries = this.props.multipleQueries;
    var tags = getTags(this);

    var namedQuery = {};
    namedQuery.type = 'Chart';
    namedQuery.tags = tags;
    namedQuery.title = this.refs.favourite.value;
    namedQuery.reportName = this.props.reportName;
    namedQuery.level = this.props.level;
    namedQuery.field = this.props.field;
    namedQuery.overlap = this.state.overlapping ? this.props.overlap.value : null;

    namedQuery.queries = [];

    for (let m = 0; m < queries.length; m++) {
      namedQuery.queries[m] = {};
      var [tt1, tt2] = computeTimespan(queries[m].query.timespan);
      namedQuery.queries[m].source = this.props.source;
      namedQuery.queries[m].time = {};
      namedQuery.queries[m].time.start = tt1.valueOf();
      namedQuery.queries[m].time.end = tt2.valueOf();
      namedQuery.queries[m].time.granularity = report.granularity;

      //the metric should be same for all series, except on peaks that MIN and MAX are both required
      var tempMetrics = [];
      for (let j = 0; j < queries[m].series.length; j++) {
        tempMetrics.push(queries[m].series[j].metric);
      }
      var metricSet = [...new Set(tempMetrics)];
      namedQuery.queries[m].metrics = metricSet;

      var tempPop = [];
      for (var k = 0; k < queries[m].series.length; k++) {
        var popu = {};
        if (queries[m].series[k].ranking) {

          var target = queries[m].series[k].population;
          var [clusterKey2, groupKey2] = population.extractGroupParams(target);
          if (target instanceof population.Utility || target == null) {
            popu.label = ('UTILITY:' + queries[m].series[k].population.key.toString() + '/' + new population.Ranking(queries[m].series[k].ranking).toString());
            popu.utility = queries[m].series[k].population.key;
          } else if (target instanceof population.Cluster) {
            popu.label = ('CLUSTER:' + clusterKey2 + '/' + new population.Ranking(queries[m].series[k].ranking).toString());
            popu.group = groupKey2;
          } else if (target instanceof population.ClusterGroup) {
            popu.label = ('CLUSTER:' + clusterKey2 + ':' + groupKey2 + '/' + new population.Ranking(queries[m].series[k].ranking).toString());
            popu.group = groupKey2;
          }

          popu.type = queries[m].series[k].population.type;

          popu.ranking = {};
          popu.ranking.field = queries[m].series[k].ranking.field.toUpperCase();
          popu.ranking.limit = queries[m].series[k].ranking.limit;
          popu.ranking.metric = queries[m].series[k].ranking.metric;
          popu.ranking.type = queries[m].series[k].ranking.type;
          tempPop.push(popu);
        } else {
          tempPop.push(queries[m].series[k].population);
        }
      }
      namedQuery.queries[m].population =
        _.uniqBy(tempPop, function (popu) { return [popu.label, popu.key, popu.group, popu.utility, popu.ranking].join(); });

    }
    var request = {
      'namedQuery': namedQuery
    };

    if (this.props.favouriteChart && this.props.favouriteChart.type == 'CHART') {
      namedQuery.id = this.props.favouriteChart.id;

      var previousTitle = this.props.favouriteChart.title;
      this.props.updateFavourite(request, previousTitle);

    } else {
      this.props.addFavourite(request);
    }
    this.setState({ dirty: true });
  },

  _specForToolbar: function () {
    // Make a spec object suitable to feed toolbars.ButtonToolbar "groups" prop.
    // Note we must take into account our current state (disabled flags for buttons)

    // Todo This fuctionality fits better to the Toolbar component,
    // e.g.: <Toolbar spec={spec} enabledButtons={flags1} activeButtons={flags2} ... />

    var cls = this.constructor;
    var { disabledButtons } = this.state;

    if (_.isEmpty(disabledButtons))
      return cls.toolbarSpec; // return the original spec

    var disabledKeys = disabledButtons.split('|');
    return cls.toolbarSpec.map(spec => ({
      ...spec,
      buttons: spec.buttons.map(b => _.merge({}, b, {
        buttonProps: {
          // A key disabled in the original spec cannot ever be enabled!
          disabled: (b.buttonProps.disabled || disabledKeys.indexOf(b.key) >= 0)
        },
      }))
    }));
  },

  _specForParameters: function () {
    var cls = this.constructor;
    var { disabledButtons } = this.state;

    if (_.isEmpty(disabledButtons))
      return cls.parameters; // return the original spec

    var disabledKeys = disabledButtons.split('|');
    return cls.parameters.map(spec => ({
      ...spec,
      buttons: spec.buttons.map(b => _.merge({}, b, {
        buttonProps: {
          // A key disabled in the original spec cannot ever be enabled!
          disabled: (b.buttonProps.disabled || disabledKeys.indexOf(b.key) >= 0)
        },
      }))
    }));
  },

  _titleForReport: function () {
    var { config } = this.context;
    var { configForReport, templates } = this.constructor;
    var { population: target } = this.props;

    var report = configForReport(this.props, { config });

    // Find a friendly name for population target
    var populationName = target ? target.name : 'Utility';
    var cluster;
    if (target instanceof population.Utility || target == null) {
      populationName = 'Utility'; //config.utility.name;
    } else if (target instanceof population.Cluster) {
      cluster = config.utility.clusters.find(c => c.key == target.key);
      populationName = 'Cluster by: ' + cluster.name;
    } else if (target instanceof population.ClusterGroup) {
      cluster = config.utility.clusters.find(c => c.key == target.clusterKey);
      var group = cluster.groups.find(g => g.key == target.key);
      populationName = cluster.name + ': ' + group.name;
    }

    return templates.reportTitle({ report, populationName });
  },

  // Wrap dispatch actions
});

var ReportInfo = React.createClass({
  statics: {},

  propTypes: {
    field: PropTypes.string.isRequired,
    level: PropTypes.string.isRequired,
    reportName: PropTypes.string.isRequired,
    requested: PropTypes.number,
    finished: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    errors: PropTypes.arrayOf(PropTypes.string),
    series: PropTypes.arrayOf(seriesPropType),
    requests: PropTypes.number,
  },

  getDefaultProps: function () {
    return {
      requested: null,
      finished: null
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
    var { field, level, reportName } = this.props;
    var { errors, finished, series } = this.props;
    var paragraph, message;

    var n = !series ? 0 : series.filter(s => (s.data.length > 0)).length;

    if (errors) {
      message = _.first(errors);
      paragraph = (<p className="help text-danger">{message}</p>);
    } else if (!n) {
      message = _.isNumber(finished) ?
        ('No data received! Last attempt was at ' + moment(finished).format('HH:mm:ss')) :
        ('No data!');
      paragraph = (<p className="help text-warning">{message}</p>);
    } else {
      message = 'Everything is fine. Updated at ' + moment(finished).format('HH:mm:ss');
      paragraph = (<p className="help text-muted">{message}</p>);
    }

    return (
      <div className="report-info" id={['info', field, level, reportName].join('--')}>
        {paragraph}
      </div>
    );
  },
});

//
// Container components
//

var reportingActions = require('../../actions/reports-measurements');
var chartingActions = require('../../actions/charting');

ReportPanel = ReactRedux.connect(
  (state, ownProps) => {
    var stateProps;
    var { fields } = state.config.reports.byType.measurements;
    var { field, level, reportName } = state.charting;

    stateProps = { field, level, reportName };

    if (!ownProps.title) {
      stateProps.title = fields[field].title;
    }

    var r2 = state.reports.measurements;
    if (r2) {

      stateProps.multipleQueries = r2.multipleQueries;
      stateProps.source = r2.source;
      stateProps.finished = r2.finished;
    }

    stateProps.overlap = state.reports.measurements.overlap;
    stateProps.overlapping = state.reports.measurements.overlapping;
    stateProps.multipleQueries = state.reports.measurements.multipleQueries;

    if (state.favourites.selectedFavourite && state.favourites.selectedFavourite.type == 'CHART') {
      stateProps.defaultFavouriteValues = state.defaultFavouriteValues;
      stateProps.favouriteChart = state.favourites.selectedFavourite;
      stateProps.favouriteSeries = state.favourites.data;
    }

    return stateProps;
  },
  (dispatch, ownProps) => {
    var { setField, setReport } = chartingActions;
    var { initialize, setSource, setQuerySource, setTimespan, setPopulation,
      refreshData, refreshMultipleData, addFavourite, updateFavourite, addQuery,
      removeSeries, initMultipleQueries, changeMultipleQueries, setOverlap } = reportingActions;
    return {
      setField: (field) => (dispatch(setField(field))),
      setReport: (level, reportName) => (dispatch(setReport(level, reportName))),
      initializeReport: (field, level, reportName, defaults) => (
        dispatch(initialize(field, level, reportName, REPORT_KEY, defaults))
      ),
      initMultipleQueries: (field, level, reportName, defaults, multipleQueries, source) => (
        dispatch(initMultipleQueries(field, level, reportName, REPORT_MULTIPLE_KEY, defaults, multipleQueries, source))
      ),
      changeMultipleQueries: (multipleQueries) => (
        dispatch(changeMultipleQueries(multipleQueries))
      ),
      refreshData: (field, level, reportName) => (
        dispatch(refreshData(field, level, reportName, REPORT_KEY))
      ),
      refreshMultipleData: (field, level, reportName) => (
        dispatch(refreshMultipleData(field, level, reportName, REPORT_MULTIPLE_KEY))
      ),
      setSource: (field, level, reportName, source) => (
        dispatch(setSource(field, level, reportName, REPORT_KEY, source))
      ),
      setQuerySource: (field, level, reportName, source) => (
        dispatch(setQuerySource(field, level, reportName, REPORT_KEY, source))
      ),
      setTimespan: (field, level, reportName, ts) => (
        dispatch(setTimespan(field, level, reportName, REPORT_KEY, ts))
      ),
      setPopulation: (field, level, reportName, p) => (
        dispatch(setPopulation(field, level, reportName, REPORT_KEY, p))
      ),
      setOverlap: (overlap) => (
        dispatch(setOverlap(overlap))
      ),
      addQuery: (field, level, reportName, numberOfSeries) => (
        dispatch(addQuery(field, level, reportName, REPORT_KEY, numberOfSeries))
      ),
      removeSeries: (field, level, reportName, numberOfSeries) => (
        dispatch(removeSeries(field, level, reportName, REPORT_KEY, numberOfSeries))
      ),
      addFavourite: (query) => (
        dispatch(addFavourite(query))
      ),
      updateFavourite: (query, previousTitle) => (
        dispatch(updateFavourite(query, previousTitle))
      )
    };
  },
)(ReportPanel);

ReportInfo = ReactRedux.connect(
  (state, ownProps) => {
    var _state = state.reports.measurements;
    var infoState = _.pick(_state, ['requested', 'finished', 'requests', 'errors']);
    infoState.series = mergeMultipleSeries(_state.multipleQueries);
    return infoState ? {} : infoState;
  },
  null
)(ReportInfo);

//
// Export
//

var ChartContainer = require('./chart-container');

module.exports = {
  Panel: ReportPanel,
  Info: ReportInfo,
  // eslint-disable-next-line react/display-name
  Chart: (props) => (
    <ChartContainer {...props} displayName={'Chart'} reportKey={REPORT_KEY} />
  ),
};
