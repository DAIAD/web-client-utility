var moment = require('moment');

var React = require('react');
var Bootstrap = require('react-bootstrap');
var ReactRedux = require('react-redux');
var Select = require('react-select').default;
var DatetimeInput = require('react-datetime');

var { Panel, PanelGroup, ListGroup, ListGroupItem, Button } = Bootstrap;
var PropTypes = React.PropTypes;

var { populationPropType, reportPropType, configPropType } = require('../../prop-types');
var { ReportByDay, ReportByWeek, ReportByMonth, ReportByYear } = require('./common-reports');

var commonPropTypes = {
  now: PropTypes.number.isRequired,
  source: PropTypes.string.isRequired,
  field: PropTypes.string.isRequired,
  uom: PropTypes.string.isRequired,
};

var OverviewPanel = React.createClass({

  statics: {
    itemSpecs: {
      day: {
        title: 'Last Day',
        Report: ReportByDay,
      },
      week: {
        title: 'Last Week',
        Report: ReportByWeek,
      },
      month: {
        title: 'Last Month',
        Report: ReportByMonth,
      },
      year: {
        title: 'Last Year',
        Report: ReportByYear,
      },
    }
  },

  propTypes: {
    ...commonPropTypes,
    reports: PropTypes.shape({
      day: reportPropType,
      week: reportPropType,
      month: reportPropType,
      year: reportPropType,
    }),
    reportKey: PropTypes.string,
    target: populationPropType,
    title: PropTypes.string.isRequired,
  },

  getDefaultProps: function () {
    return {};
  },

  render: function () {
    var { itemSpecs } = this.constructor;
    var { now, field, source, uom, reports, reportKey, target } = this.props;

    var reportProps = {
      now,
      source,
      field,
      uom,
      reportKey: !reportKey ?
        (target ? target.toString().toLowerCase() : 'utility') : reportKey,
      target,
    };

    var items = _.values(
      _.mapValues(itemSpecs, (y, k) => (
        <ListGroupItem key={k}>
          <h4>{y.title}</h4>
          <y.Report {...reportProps} report={reports[k]} />
        </ListGroupItem>
      ))
    );

    var header = (<h3>{this.props.title}</h3>);

    return (
      <Panel header={header}>
        <ListGroup fill>
          {items}
        </ListGroup>
      </Panel>
    );
  }
});

var OverviewPanelGroup = React.createClass({

  propTypes: {
    ...commonPropTypes,
    reports: PropTypes.shape({
      day: reportPropType,
      week: reportPropType,
      month: reportPropType,
      year: reportPropType,
    }),
    title: PropTypes.string.isRequired,
  },

  contextTypes: {
    config: configPropType,
  },

  getInitialState: function () {
    return {
      activeKey: 'utility',
    };
  },

  shouldComponentUpdate: function (nextProps, nextState) {
    return (
      (nextProps.now != this.props.now) ||
      (nextProps.field != this.props.field) ||
      (nextProps.source != this.props.source) ||
      (nextState.activeKey != this.state.activeKey)
    );
  },

  render: function () {
    var { now, field, source, uom, reports, title } = this.props;
    var visible = (k) => (this.state.activeKey == k);

    var commonProps = { source, field, uom, now };

    var reportProps = {
      utility: {
        ...commonProps,
        reportKey: 'utility',
        target: null,
        visible: visible('utility')
      },
      perEfficiency: {
        ...commonProps,
        reportKey: 'per-efficiency',
        target: null, // Fixme provide population.Cluster instance
        visible: visible('per-efficiency')
      },
    };

    var panelProps = {
      utility: {
        id: 'overview-utility',
        header: (<h3>{title + ' - ' + 'Utility'}</h3>),
        eventKey: 'utility',
      },
      perEfficiency: {
        id: 'overview-per-efficiency',
        header: (<h3>{title + ' - ' + 'Per Customer Efficiency'}</h3>),
        eventKey: 'per-efficiency',
      },
    };

    return (
      <PanelGroup accordion onSelect={this._selectPanel} activeKey={this.state.activeKey}>

        <Panel {...panelProps.utility}>
          <ListGroup fill>
            <ListGroupItem>
              <h4>{reports.day.title} - Last Day</h4>
              <ReportByDay {...reportProps.utility} report={reports.day} />
            </ListGroupItem>
            <ListGroupItem>
              <h4>{reports.week.title} - Last Week</h4>
              <ReportByWeek {...reportProps.utility} report={reports.week} />
            </ListGroupItem>
            <ListGroupItem>
              <h4>{reports.month.title} - Last Month</h4>
              <ReportByMonth {...reportProps.utility} report={reports.month} />
            </ListGroupItem>
            <ListGroupItem>
              <h4>{reports.year.title} - Last Year</h4>
              <ReportByYear {...reportProps.utility} report={reports.year} />
            </ListGroupItem>
          </ListGroup>
        </Panel>

        {/*
        <Panel {...panelProps.perEfficiency}>
          <div>Todo</div>
        </Panel>
        */}

      </PanelGroup>
    );
  },

  _selectPanel: function (key) {
    if (this.state.activeKey != key)
      this.setState({ activeKey: key });
    return true;
  },
});

var Form = React.createClass({

  statics: {

    defaults: {
      datetimeProps: {
        dateFormat: 'D MMM[,] YYYY',
        timeFormat: null,
        inputProps: { size: 10 },
      },
    },

    _propsToState: function ({ now, field, source }) {
      // Reset state according to newly received props
      return { now, field, source, submitted: false };
    },
  },

  contextTypes: {
    config: configPropType,
  },

  propTypes: {
    ...commonPropTypes,
    generated: PropTypes.number,
  },

  getInitialState: function () {
    return this.constructor._propsToState(this.props);
  },

  componentWillReceiveProps: function (nextProps) {
    this.setState(this.constructor._propsToState(nextProps));
  },

  render: function () {
    var { defaults } = this.constructor;
    var { config } = this.context;
    var { source, field, now, submitted } = this.state;
    var { fields, sources } = config.reports.byType.measurements;

    var sourceOptions = new Map(
      _.values(
        _.mapValues(sources, (s, k) => ([k, s.title])))
    );

    var fieldOptions = new Map(
      _.values(
        _.mapValues(
          fields, (y, k) => ((y.sources.indexOf(source) < 0) ? null : [k, y.name])
        ))
        .filter(y => y)
    );

    return (
      <form className="form-inline report-form">
        <div className="form-group" title="Select source">
          <Select className="select-source"
            value={source}
            options={Array.from(sourceOptions.entries()).map(([k, v]) => ({ value: k, label: v }))}
            searchable={false}
            clearable={false}
            onChange={(o) => (this.setState({ source: o.value }), false)}
          />
        </div>

        <div className="form-group">
          <Select className="select-field"
            value={field}
            options={Array.from(fieldOptions.entries()).map(([k, v]) => ({ value: k, label: v }))}
            searchable={false}
            clearable={false}
            onChange={(o) => (this.setState({ field: o.value }), false)}
          />
        </div>

        <div className="form-group">
          <label>Use reference time:</label>
          <DatetimeInput {...defaults.datetimeProps}
            value={now}
            onChange={(m) => (this.setState({ now: m.valueOf() }), false)}
          />
        </div>

        <div className="form-group submit-buttons">
          <Button className="submit-btn" bsStyle="default" title="Export to PDF"
            onClick={this._exportToPdf} disabled={true}
          >
            <i className="fa fa-send-o"></i>&nbsp; Export
          </Button>
          <Button className="submit-btn" bsStyle="primary" title="Re-generate reports"
            onClick={this._submit} disabled={submitted}
          >
            <i className={"fa fa-refresh" + (submitted ? ' fa-spin' : '')}></i>&nbsp; Refresh
          </Button>
        </div>
      </form>
    );
  },

  // Event handlers

  _exportToPdf: function () {
    console.warn('Todo: Exporting to PDF...');
    return false;
  },

  _submit: function () {
    if (!this.state.now) {
      console.warn('No reference time was given! Skipping refresh');
      return false;
    }

    var t = moment(this.state.now);
    if (!t.isValid()) {
      console.warn('Failed to convert to a valid moment! Skipping refresh');
      return false;
    }

    this.props.submit(this.state.source, this.state.field, t.valueOf());
    this.setState({ submitted: true });
    return false;
  },
});

//
// Container components
//

var actions = require('../../actions/overview.js');
var { connect } = ReactRedux;

var mapStateToProps = function (state, ownProps) {
  var { fields } = state.config.reports.byType.measurements;
  var { field, referenceTime, source, requested } = state.overview;
  return {
    source,
    field,
    now: referenceTime,
    uom: fields[field].unit,
    title: fields[field].title,
    generated: requested, // well, roughly
  };
};

OverviewPanel = connect(mapStateToProps, null)(OverviewPanel);

OverviewPanelGroup = connect(mapStateToProps, null)(OverviewPanelGroup);

Form = connect(
  mapStateToProps,
  (dispatch, ownProps) => {
    return {
      submit: (source, field, now) => (dispatch(actions.setup(source, field, now))),
    };
  }
)(Form);

// Export

module.exports = {
  OverviewPanelGroup,
  OverviewPanel,
  Form,
};
