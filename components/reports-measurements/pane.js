
var _ = require('lodash');
var moment = require('moment');
var sprintf = require('sprintf');

var React = require('react');
var ReactRedux = require('react-redux');
var Bootstrap = require('react-bootstrap');
var DatetimeInput = require('react-datetime');
var Select = require('react-controls/select-dropdown');
var Select2 = require('react-select');
var Switch = require('rc-switch');

var toolbars = require('../toolbars');
var Errors = require('../../constants/Errors');
var Granularity = require('../../model/granularity');
var TimeSpan = require('../../model/timespan');
var population = require('../../model/population');
var {computeKey} = require('../../reports').measurements;
var {timespanPropType, populationPropType, seriesPropType, configPropType} = require('../../prop-types');
var {equalsPair} = require('../../helpers/comparators');

var Chart = require('./chart');
var Checkbox = require('../Checkbox');

var {Button, Collapse, Panel, ListGroup, ListGroupItem, Accordion} = Bootstrap;

var {PropTypes} = React;

const REPORT_KEY = 'pane';
const REPORT_MULTIPLE_KEY = 'pane/multiple';

const MAX_QUERIES = 3;
const YEARS = 5; //available past years in dropdown 
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

var checkTimespan = function (val, level, N=4) {
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

var Option = ({value, text}) => (<option value={value} key={value}>{text}</option>);

var getDefaultQuery = function(object) {
  var {config} = object.context;
  var defaultPopulation = new population.Utility(config.utility.key, config.utility.name);
  var _config = object.context.config.reports.byType.measurements;
  var defaultTimespan = _config.levels[object.props.level].reports[object.props.reportName].timespan;
  var defaultQuery = {
    id:0,
    query: {
      timespan:defaultTimespan, population: defaultPopulation
    },
    series: null
  };  
  
  return defaultQuery;
}

var mergeMultipleSeries = function (queries) {
  if(!queries){
    return [];
  }

  var multipleSeries = [];
  for(var k=0; k< queries.length; k++){
    var series = queries[k].series ? queries[k].series : [];
    multipleSeries = multipleSeries.concat(series);
  }
  return multipleSeries;
}

var shapeFavouriteQueries = function (favouriteQueries, config) {

  //var config = config1.config;
  var multipleQueries = [];
  for(let i=0; i<favouriteQueries.length; i++){
    var query = {};

    //set id
    query.id = i;

    query.query = {};
    
    //construct population 
    var [g, rr] = population.fromString(favouriteQueries[i].population[0].label);
    var [clusterKey, groupKey] = population.extractGroupParams(g);       
    if(favouriteQueries[i].population.length === 1){
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
      query.query.population =  target;
    } else {
    //favourite population contains groups of cluster. Construct the Cluster:
      if(!clusterKey){
        console.error('Something went wrong. Malformed favourite population');
        target = new population.Utility(config.utility.key, config.utility.name);
      }
      query.query.population = new population.Cluster(clusterKey);
    }

    //construct timespan
    query.query.timespan =  [favouriteQueries[i].time.start, favouriteQueries[i].time.end];
    multipleQueries.push(query);
  }

  return multipleQueries;
}
//
// Presentational components
//

var FormStatusParagraph = ({errorMessage, dirty}) => {
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
        inputProps: {size: 10},
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

    configForReport: function (props, {config}) {
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
            tooltip: {message: 'Favourite settings', placement: 'bottom'},
            iconName: 'star-o',
            //text: 'Favourite',
            buttonProps: {bsStyle: 'default', /*className: 'btn-circle'*/ },
          },
          {
            key: 'source',
            tooltip: {message: 'Select source of measurements', placement: 'bottom'},
            iconName: 'cube',
            //text: 'Source',
            buttonProps: {bsStyle: 'default', /*className: 'btn-circle'*/ },
          },
          {
            key: 'report',
            tooltip: {message: 'Choose type of report', placement: 'bottom'},
            iconName: 'area-chart',
            //text: 'Metric',
            buttonProps: {bsStyle: 'default', /*className: 'btn-circle'*/ },
          },
        ],
      },     
      {
        key: 'actions',
        //component: 'div', // Note default is Bootstrap.ButtonGroup
        buttons: [
          {
            key: 'export',
            tooltip: {message: 'Export to a CSV table', placement: 'bottom'},
            text: 'Export',
            iconName: 'table',
            buttonProps: {disabled: true, bsStyle: 'default', /*className: 'btn-circle'*/ },
          },
          {
            key: 'refresh',
            tooltip: {message: 'Re-generate report and redraw the chart', placement: 'bottom'},
            text: 'Refresh',
            iconName: 'refresh',
            buttonProps: {bsStyle: 'primary', /*className: 'btn-circle'*/ },
          },
          {
            key: 'add',
            tooltip: {message: 'Add additional series', placement: 'bottom'},
            iconName: 'plus',
            text: 'Add Serie',
            buttonProps: {bsStyle: 'default', /*className: 'btn-circle'*/},
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
            tooltip: {message: 'Define a time range', placement: 'bottom'},
            iconName: 'calendar',
            buttonProps: {bsStyle: 'default'},
          },
          {
            key: 'population-group',
            tooltip: {message: 'Define a population target', placement: 'bottom'},
            iconName: 'users',
            buttonProps: {bsStyle: 'default'},
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
  
  contextTypes: {config: configPropType},

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
      panelChanged:true,
      overlapping:false,
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
      finished :null,
      fadeIn: false, // {className: 'fade-in', duration: 0.5},
      defaultFavouriteValues : {
        timespan : false,
        source : false,
        population : false,
        metricLevel : false
      },
      multipleQueries: [],
      overlap: {value: 'day', label: 'day'},
      overlapping: false
    };
  },

  componentWillMount: function() {

    if(this.props.favouriteChart&& this.props.favouriteChart.type == 'CHART'){
      this.props.initMultipleQueries(
           this.props.favouriteChart.field, this.props.favouriteChart.level, 
             this.props.favouriteChart.reportName, 
                 shapeFavouriteQueries(this.props.favouriteChart.queries, this.context.config));
    } 
  },
  componentDidMount: function () {
    var cls = this.constructor;
    var {field, level, reportName} = this.props;

    if (_.isEmpty(field) || _.isEmpty(level) || _.isEmpty(reportName)) {
      return; // cannot yet initialize the target report
    }

    var {timespan} = cls.configForReport(this.props, this.context);

    if(!this.props.favouriteChart){
      var defaultQuery = getDefaultQuery(this);
      this.props.initMultipleQueries(field, level, reportName, [defaultQuery]);
    }        
    this.props.refreshMultipleData(field, level, reportName).then(() => (this.setState({draw: true})));
  },

  componentWillReceiveProps: function (nextProps, nextContext) {
    var cls = this.constructor;
    
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
      console.info(sprintf(
        'The panel will switch to report (%s, %s, %s)',
        nextProps.field, nextProps.level, nextProps.reportName
      ));
      console.assert(nextContext.config == this.context.config,
        'Unexpected change for configuration in context!');
        
      var {timespan} = cls.configForReport(nextProps, nextContext);

      if(this.props.multipleQueries.length > 0 ){
        nextProps.initMultipleQueries(
          nextProps.field, nextProps.level, nextProps.reportName, this.props.multipleQueries
        );      
      } else {
        if(this.props.favouriteQuery){
          nextProps.initMultipleQueries(
              this.props.favouriteQuery.field, this.props.favouriteQuery.level, 
                  this.props.favouriteQuery.reportName, 
                      shapeFavouriteQueries(this.props.favouriteQuery.queries, this.context.config)
          );          
        } else {
          nextProps.initMultipleQueries(
            nextProps.field, nextProps.level, nextProps.reportName, [getDefaultQuery]
          );  
        }
      }

      setTimeout(
        () => (nextProps.refreshMultipleData(
          nextProps.field, nextProps.level, nextProps.reportName)
        ),
        100
      );     
//      setTimeout(
//        () => (nextProps.refreshData(
//          nextProps.field, nextProps.level, nextProps.reportName)
//        ),
//        100
//      );
    }
  },

  shouldComponentUpdate: function (nextProps, nextState) {
    // Suppress some (rather expensive) updates

    if(this.state.panelChanged){
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

    if (changedState.length == 0) console.info('Skipping update of <ReportPanel>');
    return (changedState.length > 0);
  },

  componentDidUpdate: function () {
    // The component has successfully updated

    // Check if redrawing or just redrawn
    if (this.state.draw) {
      var nextState = {dirty: false};
      if (_.isNumber(this.props.finished))
        nextState.draw = false; // next drawing will happen only on-demand
      this.setState(nextState);
    }

    // If under a CSS animation, remember to clear the flag after the animation has ended.
    // This is needed, because only a change "" -> ".fade-in" can trigger a new animation.
    if (this.state.fadeIn) {
      setTimeout(
        () => (this.state.fadeIn && this.setState({fadeIn: false})),
        (this.props.fadeIn.duration + 0.25) * 1e+3
      );
    }
    this.setState({panelChanged:false});
  },

  render: function () {
    var {defaults} = this.constructor;
    var {dirty, draw, error} = this.state;
//    if(this.props.favouriteChart && this.props.favouriteChart.type == 'CHART'
//       && this.props.defaultFavouriteValues.source
//       && this.props.defaultFavouriteValues.timespan
//       && this.props.defaultFavouriteValues.population
//       && this.props.defaultFavouriteValues.metricLevel) {
//
//      this.props.favouriteChart.finished = this.props.finished;
//
//      if(this.props.favouriteSeries){
//        this.props.favouriteChart.series = this.props.favouriteSeries;
//      }
//      else{
//        this.props.favouriteChart.series = this.props.series;
//      }
//      var {field, title, level, reportName, finished, series} = this.props.favouriteChart;
//    } else {

      var {field, title, level, reportName, finished} = this.props;
      var series = this.props.series2;
    //}
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
        finished={this.props.finished}/>
    );

    var formFragment = this._renderFormFragment();

    var parameterFragment;
    if(this.props.multipleQueries.length>0){
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
            <fieldset className={!this.state.fadeIn? '' : this.props.fadeIn.className}>
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
      var parameterFragment = this._renderParameterFragment(this.props.multipleQueries[i]);
      var multipleSerieTitle = (        
        <span>
          <span>
            <span style={{ paddingLeft: 4 }}>{this.props.multipleQueries[i] ? this.getNameForQuery(i) : 'Series ' + i}</span>
          </span>
          <span style={{float: 'right',  marginTop: -3, marginLeft: 5 }}>
            <Bootstrap.Button 
              eventKey={i} 
              bsStyle='default' 
              className='btn-circle' 
              onClick={this._removeSeries.bind(this,this.props.multipleQueries[i].id)}>
              <i className='fa fa-remove fa-fw'></i>
            </Bootstrap.Button>
          </span>
        </span>
      );
    
      multipleSeries.push(
        <Panel key={i} header={multipleSerieTitle} eventKey={i}>
          <form className="report-form form-horizontal">
            <fieldset className={!this.state.fadeIn? '' : this.props.fadeIn.className}>
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
              <fieldset className={!this.state.fadeIn? '' : this.props.fadeIn.className}>
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
              dirty={dirty} errorMessage={!error? null : ErrorMessages[error]}
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
    
    var {config} = this.context;
    var label;
    if (target instanceof population.Utility) {
      // Use utility's friendly name
      label = 'Utility';
    } else if (target instanceof population.ClusterGroup) {
      // Use group's friendly name
      var cluster = config.utility.clusters.find(c => (c.key == target.clusterKey));
      label = cluster.name + ': ' + cluster.groups.find(g => (g.key == target.key)).name;  
    } else if (target instanceof population.Cluster) {
      var cluster = config.utility.clusters.find(k => (k.key == target.key));
      label = cluster.name;
    }
    return label + ': ' + timeLabel; //todo - consider shorter time label if possible. Problem in case of many series
  }, 
  
  // Event handlers

  _handleToolbarEvent: function (groupKey, key) {
    switch (groupKey) {
      case 'shared-parameters':
        return this._switchToFormFragment(key);
        break;
      case 'query-parameters':
        return this._switchToParameterFragment(key);
        break;        
      case 'actions':
        return this._performAction(key);
        break;
    }
  },
  
  _switchToFormFragment: function (key) {
    if (this.state.formFragment != key) {
      var nextState = {formFragment: key};
      if (this.props.fadeIn)
        nextState.fadeIn = true;
      this.setState(nextState);
    }
    return false;
  },
  _switchToParameterFragment: function (key) {

    if (this.state.parameterFragment != key) {
      var nextState = {parameterFragment: key};
      if (this.props.fadeIn)
        nextState.fadeIn = true;
      this.setState(nextState);
    }
    return false;
  },
  _performAction: function (key) {
    var {field, level, reportName} = this.props;
    switch (key) {
      case 'refresh':
        {
          console.debug(sprintf(
            'About to refresh data for report (%s, %s, %s)...',
            field, level, reportName
          ));
            this.props.refreshMultipleData(field, level, reportName);        
          this.setState({draw: true});
        }
        break;
      case 'export':
        // Todo
        break;
      case 'add':
        var {field, level, reportName, multipleQueries, source, population, timespan} = this.props;

        var cls = this.constructor;
        var {timespan} = cls.configForReport(this.props, this.context);  
        var popul = multipleQueries[multipleQueries.length-1].query.population;
        var lastId = multipleQueries[multipleQueries.length-1].id;
        var queryTemp = {};
        queryTemp.id = lastId+1;
        queryTemp.query = {
          timespan: timespan,
          population: popul          
        };

        queryTemp.series = null;

        var newMult = this.props.multipleQueries;
        newMult.push(queryTemp);
        this.props.addQuery(newMult);

        if(this.props.multipleQueries.length == MAX_QUERIES){
          this.setState({disabledButtons: 'add', dirty: true, panelChanged:true});
        } else {
          this.setState({disabledButtons: '', dirty: true, panelChanged:true});
        }
        break;
    }
  },
  _removeSeries: function (i) {
    var newMults = this.props.multipleQueries.filter(function(obj) {
      return obj.id !== i;
    });

    this.props.removeSeries(newMults);
    this.setState({panelChanged:true});
    if(this.props.multipleQueries.length == MAX_QUERIES){
      this.setState({disabledButtons: ''});
    }
  },
  
  _setSource: function (source) {
    var {field, level, reportName} = this.props;

    //this.props.defaultFavouriteValues.source = false;
    this.props.setQuerySource(source.value);
    //this.props.setSource(field, level, reportName, source);
    this.setState({dirty: true});
    return false;
  },
  
  _setReport: function (level, reportName) {
    //this.props.defaultFavouriteValues.metricLevel = false;
    
    this.props.setReport(level, reportName);
    this.setState({dirty: true});
    return false;
  },

  _setField: function (field) {
    this.props.setField(field);
    this.setState({dirty: true});
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
      var {field, level, reportName} = this.props;
      this.props.setTimespan(field, level, reportName, timespan);
    }

    // Update state with (probably invalid) timespan (to keep track of user input)
    this.setState({dirty: true, timespan: value, error});
    return false;
  },
  
  //set overlapping timespan for current query
  _setQueryOverlappingTimespan: function (value, query) { 
    //this.props.defaultFavouriteValues.timespan = false;
    
    var queryTimespan, overlapTimespan;
    if(this.state.overlapping){
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
    if(mq.length > 0){
      for (var i in mq) {
        if (mq[i].id == query.id) {
          mq[i].query.timespan = queryTimespan;
        }
      }      
    } else {
      q = getDefaultQuery(this);
      q.query.timespan = queryTimespan;
      mq = [q];    
    }
    
    //Todo - validate timespan when Custom values is implemented for overlapping.
    this.props.changeMultipleQueries(mq);
    
    var error = null;

    // Update state with (probably invalid) timespan (to keep track of user input)
    this.setState({dirty: true, timespan: value, error, panelChanged: true, pickerOpen: false, overlapTimespan: overlapTimespan});
    return false;
  },  
  //set timespan for current query
  _setQueryTimespan: function (value, query) { //todo - set interval not single datime value

    //this.props.defaultFavouriteValues.timespan = false;
    
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

    if(mq.length > 0){
      for (var i in mq) {
        if (mq[i].id == query.id) {
          mq[i].query.timespan = queryTimespan;
        }
      }      
    } else {
      q = getDefaultQuery(this);
      q.query.timespan = queryTimespan;
      mq = [q];    
    }    

    // If valid, invoke setTimespan()
    if (!error) {
      var {field, level, reportName} = this.props;
      this.props.changeMultipleQueries(mq);
      //this.props.setTimespan(field, level, reportName, timespan);
    }

    // Update state with (probably invalid) timespan (to keep track of user input)
    this.setState({dirty: true, timespan: value, error, panelChanged: true});
    return false;
  },  
  
  _setPopulation: function (clusterKey, groupKey) {

    //this.props.defaultFavouriteValues.population = false;

    var {field, level, reportName} = this.props;
    var {config} = this.context;

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
    this.setState({dirty: true});
    return false;
  },
  
  _setQueryPopulation: function (clusterKey, groupKey, query) {

    var {field, level, reportName} = this.props;
    var {config} = this.context;

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
    this.setState({dirty: true, panelChanged: true});
    return false;
  },
  
  // Helpers

  _renderFormFragment: function () {
    var {defaults} = this.constructor;
    var {helpMessages} = defaults;
    var {config} = this.context;
    var {fields, sources, levels} = config.reports.byType.measurements;
    var overlap = config.reports.overlap.values;
    delete overlap.week; //excluding week from overlap options

    var {level} = this.props;
    var clusterKey;
    var fragment1; // single element or array of keyed elements
    switch (this.state.formFragment) {
      case 'favourite':
        var favouriteButtonText = this.props.favouriteChart ? 'Update Favourite' : 'Add Favourite';
        {
          //Calculate tags

          //var [t1, t2] = computeTimespan(this.props.timespan);
          var [t1, t2] = computeTimespan(this.props.multipleQueries[0].query.timespan);
          
          var start = this.props.defaultFavouriteValues.timespan ?
            moment(this.props.favouriteChart.query.time.start).format("DD/MM/YYYY") : t1.format("DD/MM/YYYY");

          var end = this.props.defaultFavouriteValues.timespan ?
            moment(this.props.favouriteChart.query.time.start).format("DD/MM/YYYY") : t2.format("DD/MM/YYYY");

//          if(this.props.defaultFavouriteValues.population){
//            clusterKey = population.Group.fromString(this.props.favouriteChart.query.population[0].label).clusterKey;
//
//            if(this.props.favouriteChart.query.population.length > 1){ //ClusterGroup with all groups
//              groupKey = null;
//            } else if(this.props.favouriteChart.query.population[0].type == 'UTILITY') { //Utility all
//              clusterKey = groupKey = null;
//            } else if(this.props.favouriteChart.query.population.length == 1){ //ClusterGroup with subgroup
//              groupKey = population.Group.fromString(this.props.favouriteChart.query.population[0].label).key;
//            } else{
//              console.error('Could not resolve options for favourite population!');
//            }
//          }

          var {clusters} = config.utility;
          var selectedCluster = !clusterKey? null : clusters.find(c => (c.key == clusterKey));
          var favouritePopulationTag = selectedCluster ? selectedCluster.name : 'Everyone';

          var [clusterKey2, groupKey2] = population.extractGroupParams(this.props.population);

          var selectedCluster2 = !clusterKey2? null : clusters.find(c => (c.key == clusterKey2));
          var selectedPopulationTag = selectedCluster2 ? selectedCluster2.name : 'Everyone';

          var defaultSource = this.props.source == 'device' ? 'AMPHIRO' : 'METER';

          var tags = 'Chart - ' + (this.props.defaultFavouriteValues.source ? this.props.favouriteChart.query.source : defaultSource) + ' - ' +
              (start + ' to ' + end) + ' - ' +
                  (this.props.defaultFavouriteValues.levelMetric ? 'Level: ' +
                      this.props.favouriteChart.level : 'Level: ' + this.props.level) + ' - ' +
                          (this.props.defaultFavouriteValues.population ? favouritePopulationTag : selectedPopulationTag);
          // \Calculate tags

          var enableHelpText = this.state.dirty ? 'Refresh to enable saving.' : '';
          fragment1 = (
            <div>
              <div className='col-md-3'>
                <input  id='label' name='favourite' type='favourite' ref='favourite' autofocus
                  defaultValue ={this.props.favouriteChart ? this.props.favouriteChart.title : null}
                  placeholder='Label ...' className='form-control' style={{ marginBottom : 15 }}/>
                <span className='help-block'>Insert a label for this favourite</span>
              </div>
            <div className='col-md-6'>
              <input  id='name' name='name' type='name' ref='name' autofocus disabled
                placeholder={tags} className='form-control' style={{ marginBottom : 15 }}/>
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
          var {source} = this.props;
          var sourceOptions = new Map(
            _.intersection(_.keys(sources), fields[this.props.field].sources)
              .map(k => ([k, sources[k].title]))
          );
          
//          if(this.props.defaultFavouriteValues.source){
//            if(this.props.favouriteChart.query.source == 'AMPHIRO'){
//              source = 'device';
//            }
//            else{
//              source = 'meter';
//            }
//          }

          fragment1 = (
            <div className="form-group">
              <label className="col-sm-2 control-label">Source:</label>
              <div className="col-sm-4">
                <Select2 className="select-source"
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
          var {reportName} = this.props;
          var overlapOptions = Object.keys(overlap).map(function(key) {
            return {value: key, label: overlap[key].name};
          });
 
          var reportOptions = new Map(
            _.values(
              _.mapValues(levels[level].reports, (r, k) => ([k, r.title]))
            )
          );
          var reportOptions2 = Object.keys(levels[level].reports).map(function(key) {
            return {value: key, label: levels[level].reports[key].title};
          });
          level = this.props.defaultFavouriteValues.metricLevel ? this.props.favouriteChart.level : level;
          fragment1 = [
            (
              <div key="level" className="form-group" >
                <label className="col-sm-2 control-label">Level:</label>
                <div className="col-sm-3">
                  <Select2 className="select-level"
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
                  <Select2 className="select-report"
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
                  <Select2 name='select-overlap'
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
                  <Switch className="col-sm-2" style={{marginTop:7}}
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
    //this.props.setQueryTimespan
    this.setState({dirty: true, overlapping:!this.state.overlapping})
  },
  
  _setOverlap: function (value) {
    this.props.setOverlap(value);
    
    var ov = value.value + 's'; //adding 's' to feed datePicker options
    this.setState({dirty:true, panelChanged:true, viewMode:ov});
  },

  _renderParameterFragment: function (query) {

    var {defaults} = this.constructor;
    var {helpMessages} = defaults;
    var {config} = this.context;
    var {fields, sources, levels} = config.reports.byType.measurements;
    var {level} = this.props;
    var clusterKey;
    var fragment1; // single element or array of keyed elements
    switch (this.state.parameterFragment) {
      case 'timespan':
        {
          var {timespan} = query.query;

          if(timespan == null){
            break;
          }
          
          var [t0, t1] = this.props.defaultFavouriteValues.timespan ? computeTimespan(
              [this.props.favouriteChart.query.time.start,this.props.favouriteChart.query.time.end]) : computeTimespan(timespan);
          
          var datetimeProps = _.merge({}, defaults.datetimeInputProps, {
            inputProps: {
              disabled: _.isString(timespan)? 'disabled' : null
            },
          });
          
          //todo - At custom select put a single reference time for year
          var timespanOptions = new Map(
            Array.from(TimeSpan.common.entries())
              .map(([k, u]) => ([k, u.title]))
              .filter(([k, u]) => checkTimespan(k, level) === 0)
          );

          timespanOptions.set('', 'Custom...');

          if(!_.isString(query.query.timespan)){
            var overlapTimespan;
            switch (this.state.viewMode) {
              case 'years':
                overlapTimespan = moment(query.query.timespan[0]).format('YYYY');
              break;
              case 'months':
                overlapTimespan = moment(query.query.timespan[0]).format('MMM YYYY');
              break;
              case 'days':
                overlapTimespan = moment(query.query.timespan[0]).format('DD MMM YYYY');
              break;
            }
          }
          
          if(this.state.overlapping){
            var refTimespan = computeTimespan(query.query.timespan);
            var refTimeFromString = refTimespan[0].format('DD MMM YYYY');
            var timeValue = _.isString(query.query.timespan)? query.query.timespan : overlapTimespan;
            fragment1 = (
              <div className="form-group">
                <label className="col-sm-2 control-label">Overlap Time:</label>
                <div className="col-sm-4">
                  <DatetimeInput
                    closeOnSelect={true}
                    open= {this.state.pickerOpen}
                    //isValidDate - todo - restrict user to selected bucket (disable dates not)
                    dateFormat={'MMM[,] YYYY'}
                    timeFormat= {false}
                    viewMode={this.state.viewMode}
                    value={timeValue}
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
                    value={_.isString(timespan)? timespan : ''}
                    options={timespanOptions}
                    onChange={(val) => (this._setQueryTimespan(val? (val) : ([t0, t1]), query))}
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
          var {clusters} = config.utility;

          var clusterOptions = [
            {
              group: null,
              options: new Map([['', 'None']])
            }, {
              group: 'Cluster By:',
              options: new Map(clusters.map(c => ([c.key, c.name ])))
            },
          ];
          var [clusterKey, groupKey] = population.extractGroupParams(target);

          var selectedCluster = !clusterKey? null : clusters.find(c => (c.key == clusterKey));

          var groupOptions = [
            {
              group: clusterKey? 'All groups' : 'No groups',
              options: new Map([['', clusterKey? 'All' : 'Everyone']]),
            }, {
              group: 'Pick a specific group:',
              options: !clusterKey? [] : new Map(
                selectedCluster.groups.map(g => ([g.key, selectedCluster.name + ': ' + g.name]))
              ),
            },
          ];

          fragment1 = (
            <div className="form-group">
              <label className="col-sm-2 control-label">Group:</label>
              <div className="col-sm-9">
                <Select className='select-cluster'
                  value={clusterKey || ''}
                  onChange={(val) => this._setQueryPopulation(val, null, query)}
                  options={clusterOptions}
                 />
                &nbsp;&nbsp;
                <Select className='select-cluster-group'
                  value={groupKey || ''}
                  onChange={(val) => this._setQueryPopulation(clusterKey, val, query)}
                  options={groupOptions}
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
  
  _enableButton: function(key, flag=true) {
    var {disabledButtons: value} = this.state, nextValue = null;
    var disabledKeys = value? value.split('|') : [];
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
      this.setState({disabledButtons: nextValue});
  },

  _clickedAddFavourite: function() {
  
    var {config} = this.context;
    var multipleFavouriteRequest = [];
    var queries = this.props.multipleQueries;
    
    for(let i=0; i<queries.length;i++){
      var [t1, t2] = computeTimespan(queries[i].query.timespan);

      var start = this.props.defaultFavouriteValues.timespan ?
        moment(this.props.favouriteChart.query.time.start).format("DD/MM/YYYY") : t1.format("DD/MM/YYYY");

      var end = this.props.defaultFavouriteValues.timespan ?
        moment(this.props.favouriteChart.query.time.end).format("DD/MM/YYYY") : t2.format("DD/MM/YYYY");

      var clusterKey, groupKey;

      var {clusters} = config.utility;
      var selectedCluster = !clusterKey? null : clusters.find(c => (c.key == clusterKey));
      var favouritePopulationTag = selectedCluster ? selectedCluster.name : 'Everyone';

      var [clusterKey2, groupKey2] = population.extractGroupParams(queries[i].query.population);

      var selectedCluster2 = !clusterKey2? null : clusters.find(c => (c.key == clusterKey2));
      var selectedPopulationTag = selectedCluster2 ? selectedCluster2.name : 'Everyone';

      var defaultSource = this.props.source == 'device' ? 'AMPHIRO' : 'METER';
      var tags = 'Chart - ' + (this.props.defaultFavouriteValues.source ?
          this.props.favouriteChart.query.source : defaultSource) + ' - ' +
              (start + ' to ' + end) + ' - ' +
                  (this.props.defaultFavouriteValues.levelMetric ? 'Level: ' +
                      this.props.favouriteChart.level : 'Level: ' + this.props.level) + ' - ' +
                          (this.props.defaultFavouriteValues.population ?
                              favouritePopulationTag : selectedPopulationTag);
      break; //todo- change above loop and redefine tags for multiple queries.                          
    }
    
                     
    var namedQuery = {};
    namedQuery.type = 'Chart';
    namedQuery.tags = tags;
    namedQuery.title = this.refs.favourite.value;
    namedQuery.reportName = this.props.reportName;
    namedQuery.level = this.props.level;
    namedQuery.field = this.props.field;

    namedQuery.queries = [];

    for(let m=0; m<queries.length;m++){ 
      namedQuery.queries[m] = {};
      var [tt1, tt2] = computeTimespan(queries[m].query.timespan);
      namedQuery.queries[m].source = this.props.source;
      namedQuery.queries[m].time = {};
      namedQuery.queries[m].time.start = tt1.valueOf();
      namedQuery.queries[m].time.end = tt2.valueOf();
      namedQuery.queries[m].time.granularity = this.props.level.toUpperCase();

      //the metric should be same for all series, except on peaks that MIN and MAX are both required
      var tempMetrics = [];
      for(let j=0; j<queries[m].series.length; j++){
        tempMetrics.push(queries[m].series[j].metric);
      }
      var metricSet = [...new Set(tempMetrics)];
      namedQuery.queries[m].metrics = metricSet;     

      var tempPop = [];
      for(var k = 0; k<queries[m].series.length; k++){
        var popu = {};
        if(queries[m].series[k].ranking){

          var target = queries[m].series[k].population;
          var [clusterKey2, groupKey2] = population.extractGroupParams(target);
          if (target instanceof population.Utility || target == null) {
            popu.label = ('UTILITY:'+queries[m].series[k].population.key.toString() + '/' + new population.Ranking(queries[m].series[k].ranking).toString());
            popu.utility = queries[m].series[k].population.key;
          } else if (target instanceof population.Cluster) {
            popu.label = ('CLUSTER:'+clusterKey2 + '/' + new population.Ranking(queries[m].series[k].ranking).toString());
            popu.group = groupKey2;
          } else if (target instanceof population.ClusterGroup) {
            popu.label = ('CLUSTER:'+clusterKey2 +':'+ groupKey2+ '/' + new population.Ranking(queries[m].series[k].ranking).toString());
            popu.group = groupKey2;
          }

          popu.type = queries[m].series[k].population.type;

          popu.ranking = {};
          popu.ranking.field = queries[m].series[k].ranking.field.toUpperCase();
          popu.ranking.limit = queries[m].series[k].ranking.limit;
          popu.ranking.metric = queries[m].series[k].ranking.metric;
          popu.ranking.type = queries[m].series[k].ranking.type;
          tempPop.push(popu);
        } else{
          tempPop.push(queries[m].series[k].population);
        }
      }
      namedQuery.queries[m].population =  
         _.uniqBy(tempPop, function(popu) 
           { return [popu.label, popu.key, popu.group, popu.utility, popu.ranking].join(); });
      var request =  {
        'namedQuery' : namedQuery
      };
    }

      if(this.props.favouriteChart && this.props.favouriteChart.type == 'CHART'){
        namedQuery.id = this.props.favouriteChart.id;
        this.props.updateFavourite(request);
      } else{

        this.props.addFavourite(request);
      }
    this.setState({dirty: true});
  },

  _specForToolbar: function () {
    // Make a spec object suitable to feed toolbars.ButtonToolbar "groups" prop.
    // Note we must take into account our current state (disabled flags for buttons)

    // Todo This fuctionality fits better to the Toolbar component,
    // e.g.: <Toolbar spec={spec} enabledButtons={flags1} activeButtons={flags2} ... />

    var cls = this.constructor;
    var {disabledButtons} = this.state;

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
    var {disabledButtons} = this.state;

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
    var {config} = this.context;
    var {configForReport, templates} = this.constructor;
    var {population: target} = this.props;

    var report = configForReport(this.props, {config});

    // Find a friendly name for population target
    var populationName = target? target.name : 'Utility';
    if (target instanceof population.Utility || target == null) {
      populationName = 'Utility'; //config.utility.name;
    } else if (target instanceof population.Cluster) {
      var cluster = config.utility.clusters.find(c => c.key == target.key);
      populationName = 'Cluster by: ' + cluster.name;
    } else if (target instanceof population.ClusterGroup) {
      var cluster = config.utility.clusters.find(c => c.key == target.clusterKey);
      var group = cluster.groups.find(g => g.key == target.key);
      populationName = cluster.name + ': ' + group.name;
    }

    return templates.reportTitle({report, populationName});
  },

  // Wrap dispatch actions
});

var ReportForm = React.createClass({
  statics: {
    defaults: {
      datetimeInputProps: {
        closeOnSelect: true,
        dateFormat: 'ddd D MMM[,] YYYY',
        timeFormat: null,
        inputProps: {size: 9},
      },
    },

    timespanOptions: [].concat(
      Array.from(TimeSpan.common.entries()).map(([name, u]) => ({value: name, text: u.title})),
      [{value: '', text: 'Custom...'}]
    ),
  },

  propTypes: {
    field: PropTypes.string.isRequired,
    level: PropTypes.string.isRequired,
    reportName: PropTypes.string.isRequired,
    source: PropTypes.oneOf(['meter', 'device']),
    timespan: timespanPropType,
    population: populationPropType,
  },

  contextTypes: {config: configPropType},

  // Lifecycle

  getInitialState: function () {
    return {
      dirty: false,
      error: null,
      timespan: this.props.timespan,
      collapsed: false,
    };
  },

  getDefaultProps: function () {
    return {
      inlineForm: true,
      source: 'meter',
      timespan: 'month',
      population: null,
    };
  },

  componentDidMount: function () {
    var {level, reportName} = this.props;

    var _config = this.context.config.reports.byType.measurements;
    var report = _config.levels[level].reports[reportName];

    this.props.initMultipleQueries();
    this.props.refreshMultipleData();
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

      this.setState({dirty: false, error: null});

      nextProps.initializeMultipleQueries();

      setTimeout(nextProps.refreshMultipleData, 100);
    }

    // Reset timespan
    if (nextProps.timespan != this.props.timespan) {
      this.setState({timespan: nextProps.timespan});
    }
  },

  render: function () {
    var cls = this.constructor;
    var {config} = this.context;
    var {field, level, reportName, source, population: target, inlineForm} = this.props;
    var {timespan, error, collapsed} = this.state;

    var _config = config.reports.byType.measurements;
    var [t0, t1] = computeTimespan(timespan);

    var datetimeProps = _.merge({}, cls.defaults.datetimeInputProps, {
      inputProps: {disabled: _.isString(timespan)? 'disabled' : null}
    });

    var sourceOptions = _config.fields[field].sources.map(k => ({
      value: k, text: _config.sources[k].title
    }));

    var timespanOptions = cls.timespanOptions.filter(
      o => (!o.value || checkTimespan(o.value, level) === 0)
    );

    var clusterOptions = config.utility.clusters.map(
      c => ({value: c.key, text: c.name })
    );

    var [clusterKey, groupKey] = population.extractGroupParams(target);
    var groupOptions = !clusterKey? [] :
      config.utility.clusters
        .find(c => (c.key == clusterKey))
          .groups.map(g => ({value: g.key, text: g.name}));

    var selectSource = (
      <Select className="select-source" value={source} onChange={this._setSource}>
        {sourceOptions.map(Option)}
      </Select>
    );

    var selectTimespan = (
      <Select className="select-timespan"
        value={_.isString(timespan)? timespan : ''}
        onChange={(val) => (this._setTimespan(val? (val) : ([t0, t1])))}
       >
        {timespanOptions.map(Option)}
      </Select>
    );

    var inputStarts = (
      <DatetimeInput {...datetimeProps}
        value={t0.toDate()}
        onChange={(val) => (this._setTimespan([val, t1]))}
       />
    );

    var inputEnds = (
      <DatetimeInput {...datetimeProps}
        value={t1.toDate()}
        onChange={(val) => (this._setTimespan([t0, val]))}
       />
    );

    var selectCluster = (
      <Select className='select-cluster'
        value={clusterKey || ''}
        onChange={(val) => this._setPopulation(val, null)}
       >
        <option value="" key="" >None</option>
        <optgroup label="Cluster by:">
          {clusterOptions.map(Option)}
        </optgroup>
      </Select>
    );

    var selectClusterGroup = (
      <Select className='select-cluster-group'
        value={groupKey || ''}
        onChange={(val) => this._setPopulation(clusterKey, val)}
       >
        <optgroup label={clusterKey? 'All groups' : 'No groups'}>
          <option value="" key="">{clusterKey? 'All' : 'Everyone'}</option>
        </optgroup>
        <optgroup label="Pick a specific group:">
          {groupOptions.map(Option)}
        </optgroup>
      </Select>
    );

    var buttonRefresh = (
      <Button onClick={this._refresh} bsStyle="primary" disabled={!!error} title="Refresh">
        <i className="fa fa-refresh"></i>&nbsp; Refresh
      </Button>
    );

    var buttonSave = (
      <Button onClick={this._saveAsImage} bsStyle="default" disabled={true} title="Save">
        <i className="fa fa-save" ></i>&nbsp; Save as image
      </Button>
    );

    var buttonExport = (
      <Button onClick={this._exportToTable} bsStyle="default" disabled={true} title="Export">
        <i className="fa fa-table" ></i>&nbsp; Export as table
      </Button>
    );

    var form, formId = ['panel', field, level, reportName].join('--');
    var statusParagraph = (
      <FormStatusParagraph
        dirty={this.state.dirty} errorMessage={!error? null : ErrorMessages[error]}
       />
    );
    if (inlineForm) {
      form = (
        <form className="form-inline report-form" id={formId}>
          <div className="form-group">
            <label>Source:</label>&nbsp;{selectSource}
          </div>
          <div className="form-group">
            <label>Time:</label>&nbsp;
            {selectTimespan}&nbsp;{inputStarts}&nbsp;{inputEnds}
          </div>
          <div className="form-group">
            <label>Group:</label>&nbsp;
            {selectCluster}&nbsp;{selectClusterGroup}
          </div>
          <br />
          <div className="form-group">
            {buttonRefresh}&nbsp;&nbsp;{buttonSave}&nbsp;&nbsp;{buttonExport}
          </div>
          {statusParagraph}
        </form>
      );
    } else {
      form = (
        <form className="form-horizontal report-form" id={formId}>
          <fieldset>
          <legend>
            <span className="title" style={{cursor: 'pointer'}} onClick={this._toggleCollapsed}>Parameters</span>
            <i className={collapsed? "fa fa-fw fa-caret-down" : "fa fa-fw fa-caret-up"}></i>
            {this._markupSummary(source, [t0, t1], [clusterKey, groupKey])}
          </legend>
          <Collapse in={!collapsed}><div>
            <div className="form-group">
              <label className="col-sm-2 control-label">Source:</label>
              <div className="col-sm-9">{selectSource}</div>
            </div>
            <div className="form-group">
              <label className="col-sm-2 control-label">Time:</label>
              <div className="col-sm-9">
                {selectTimespan}&nbsp;&nbsp;{inputStarts}&nbsp;-&nbsp;{inputEnds}
              </div>
            </div>
            <div className="form-group">
              <label className="col-sm-2 control-label">Group:</label>
              <div className="col-sm-9">
                {selectCluster}&nbsp;&nbsp;{selectClusterGroup}
               </div>
            </div>
          </div></Collapse>
          </fieldset>
          <div className="form-group">
            <div className="col-sm-12">
              {buttonRefresh}&nbsp;&nbsp;{buttonSave}&nbsp;&nbsp;{buttonExport}
            </div>
          </div>
          {statusParagraph}
        </form>
      );
    }

    return form;
  },

  // Event handlers

  _toggleCollapsed: function () {
    this.setState({collapsed: !this.state.collapsed});
  },

  _setTimespan: function (value) {
    var error = null, timespan = null;

    // Validate
    if (_.isString(value)) {
      // Assume a symbolic name is always valid
      timespan = value;
    } else if (_.isArray(value)) {
      // Check if given timespan is a valid range
      console.assert(value.length == 2 && value.every(t => moment.isMoment(t)),
        'Expected a pair of moment instances');
      error = checkTimespan(value, this.props.level);
      if (!error)
        timespan = [value[0].valueOf(), value[1].valueOf()];
    }

    // If valid, invoke setTimespan()
    if (timespan != null)
      this.props.setTimespan(timespan);

    // Update state with a (probably invalid) timespan (to keep track of user input)
    this.setState({dirty: true, timespan: value, error});

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
    this.setState({dirty: true, panelChanged: true});
    return false;
  },

  _setSource: function (val) {
    this.props.setQuerySource(val);
    this.setState({dirty: true});
    return false;
  },

  _refresh: function () {
    this.props.refreshMultipleData();
    this.setState({dirty: false});
    return false;
  },

  _saveAsImage: function () {
    console.info('Todo: Saving to image...');
    return false;
  },

  _exportToTable: function () {
    console.info('Todo: Exporting to CSV...');
    return false;
  },

  // Helpers

  _markupSummary: function (source, [t0, t1], [clusterKey, groupKey]) {
    var _config = this.context.config.reports.byType.measurements;
    const openingBracket = (<span>&#91;</span>);
    const closingBracket = (<span>&#93;</span>);
    const delimiter = (<span>::</span>);

    t0 = moment(t0); t1 = moment(t1);
    var datefmt = (t0.year() == t1.year())? 'D/MMM' : 'D/MMM/YYYY';
    var formattedTime = sprintf('From %s To %s', t0.format(datefmt), t1.format(datefmt));
    return (
      <span className="summary-wrapper">
        {openingBracket}&nbsp;
        <span className="summary">
          <span>{_config.sources[source].name}</span>
          &nbsp;{delimiter}&nbsp;
          <span>{formattedTime}</span>
        </span>
        &nbsp;{closingBracket}
      </span>
    );
  },
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
    var {field, level, reportName} = this.props;
    var {errors, requests, requested, finished, series} = this.props;
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
    var {fields} = state.config.reports.byType.measurements;
    var {field, level, reportName} = state.charting;

    stateProps = {field, level, reportName};

    if (!ownProps.title){
      //stateProps.title = 'Shared Settings';
      stateProps.title = fields[field].title;
    }  
    var key = computeKey(field, level, reportName, REPORT_KEY);
    
    var key2 = computeKey(field, level, reportName, REPORT_MULTIPLE_KEY);
    var r2 = state.reports.measurements;
    if (r2) {

      // Found an initialized intance of the report for (field, level, reportName)
      var {multipleQueries} = r2;
      stateProps.multipleQueries = r2.multipleQueries;
      stateProps.source = r2.source;
      stateProps.finished = r2.finished;
    }
    
    stateProps.overlap = state.reports.measurements.overlap;
    stateProps.overlapping = state.reports.measurements.overlapping;
    stateProps.multipleQueries = state.reports.measurements.multipleQueries;

    stateProps.defaultFavouriteValues = state.defaultFavouriteValues;
    stateProps.favouriteChart = state.favourites.selectedFavourite;
    stateProps.favouriteSeries = state.favourites.data;

    return stateProps;
  },
  (dispatch, ownProps) => {
    var {setField, setLevel, setReport} = chartingActions;
    var {initialize, setSource, setQuerySource, setTimespan, setPopulation,
         refreshData, refreshMultipleData, addFavourite, updateFavourite, addQuery, 
         removeSeries, initMultipleQueries, changeMultipleQueries, setOverlap} = reportingActions;
    return {
      setField: (field) => (dispatch(setField(field))),
      setReport: (level, reportName) => (dispatch(setReport(level, reportName))),
      initializeReport: (field, level, reportName, defaults) => (
        dispatch(initialize(field, level, reportName, REPORT_KEY, defaults))
      ),
      initMultipleQueries: (field, level, reportName, defaults, multipleQueries) => (
        dispatch(initMultipleQueries(field, level, reportName, REPORT_MULTIPLE_KEY, defaults, multipleQueries))
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
      updateFavourite: (query) => (
        dispatch(updateFavourite(query))
      )
    };
  },
)(ReportPanel);

ReportForm = ReactRedux.connect(
  (state, ownProps) => {
    var {field, level, reportName} = ownProps;
    var _state = state.reports.measurements;
    var key = computeKey(field, level, reportName, REPORT_KEY);
    return !(key in _state)? {} :
      _.pick(_state[key], ['source', 'timespan', 'population']);
  },
  (dispatch, ownProps) => {
    var {field, level, reportName} = ownProps;
    var {initialize, setSource, setTimespan, setPopulation, refreshData} = reportingActions;
    return {
      initializeReport: (defaults) => (
        dispatch(initialize(field, level, reportName, REPORT_KEY, defaults))
      ),   
      setSource: (source) => (
        dispatch(setSource(field, level, reportName, REPORT_KEY, source))
      ),
      setTimespan: (ts) => (
        dispatch(setTimespan(field, level, reportName, REPORT_KEY, ts))
      ),
      setPopulation: (p) => (
        dispatch(setPopulation(field, level, reportName, REPORT_KEY, p))
      ),
      refreshData: () => (
        dispatch(refreshData(field, level, reportName, REPORT_KEY))
      ),   
    };
  }
)(ReportForm);

ReportInfo = ReactRedux.connect(
  (state, ownProps) => {
    var {field, level, reportName} = ownProps;
    var _state = state.reports.measurements;
    var key = computeKey(field, level, reportName, REPORT_KEY);
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
  Form: ReportForm,
  Info: ReportInfo,
  Chart: (props) => (
    <ChartContainer {...props} reportKey={REPORT_KEY} />
  ),
};
