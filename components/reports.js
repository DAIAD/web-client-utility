var _ = require('lodash');
var moment = require('moment');

var React = require('react');
var ReactRedux = require('react-redux');
var Select = require('react-select').default;

var PropTypes = React.PropTypes;
var { configPropType } = require('../prop-types');

var MeasurementsReportPanel = React.createClass({
  propTypes: {
    config: configPropType,
  },

  childContextTypes: { config: configPropType },

  getChildContext: function () {
    return { config: this.props.config };
  },

  render: function () {
    var pane = require('./reports-measurements/pane');
    var { config } = this.props;

    var ready = (
      !_.isEmpty(config) && !_.isEmpty(config.reports) && !_.isEmpty(config.utility)
    );
    if (!ready) {
      return (<div>Loading configuration...</div>);
    }

    return (
      <div className="reports reports-measurements">
        {/*<h2>Chart</h2>*/}
        <pane.Panel />
      </div>
    );
  },
});

var SystemReportsSection = React.createClass({
  propTypes: {
    config: configPropType,
    level: PropTypes.string,
    reportName: PropTypes.string,
  },

  childContextTypes: { config: configPropType },

  getChildContext: function () {
    return { config: this.props.config };
  },

  render: function () {
    var { config, level, reportName } = this.props;
    var _config = config.reports.byType.system;

    if (_.isEmpty(config)) {
      return (<div>Loading configuration...</div>);
    }

    var heading = (
      <h3>
        {_config.title}
        <span className="delimiter">&nbsp;/&nbsp;</span>
        {_config.levels[level].title}
        <span className="delimiter">&nbsp;/&nbsp;</span>
        {_config.levels[level].reports[reportName].title}
      </h3>
    );

    var Report;
    switch (reportName) {
      default:
        Report = require('./reports-system/data-transmission').Report;
        break;
      case 'data-transmission':
        Report = require('./reports-system/data-transmission').Report;
        break;
    }

    return (
      <section className="reports reports-system">
        {heading}
        <Report level={level} reportName={reportName} />
      </section>
    );
  },
});

var Overview = React.createClass({
  propTypes: {
    config: configPropType,
    now: PropTypes.number,
  },

  childContextTypes: { config: configPropType },

  getChildContext: function () {
    return { config: this.props.config };
  },

  render: function () {
    var overview = require('./reports-measurements/overview');
    var { config, now } = this.props;

    var ready = (
      !_.isEmpty(config) &&
      !_.isEmpty(config.reports) && !_.isEmpty(config.utility) && !_.isEmpty(config.overview)
    );
    if (!ready) {
      return (<div>Loading configuration...</div>);
    }

    return (
      <div className="overview reports">
        <h2>
          Reports
          <small className="info">
            Generated around a reference time of <strong>{moment(now).format('D MMM, YYYY')}</strong>
          </small>
        </h2>
        <overview.Form />
        <overview.OverviewPanelGroup reports={config.overview.reports} />
      </div>
    );
  },
});

var PilotReports = React.createClass({

  propTypes: {
    config: configPropType,
  },

  childContextTypes: { config: configPropType },

  getChildContext: function () {
    return { config: this.props.config };
  },

  render: function () {
    var reports = require('./reports-measurements/pilot-reports');

    var { config } = this.props;
    var ready = (
      !_.isEmpty(config) &&
      !_.isEmpty(config.reports) && !_.isEmpty(config.utility) && !_.isEmpty(config.overview)
    );
    if (!ready) {
      return (<div>Loading configuration...</div>);
    }

    return (
      <div className="reports-measurements reports pilot-reports">
        <reports.Form />
        <reports.ReportsPanel />
      </div>
    );
  }

});

//
// Containers
//

Overview = ReactRedux.connect(
  (state) => ({ now: state.overview.referenceTime })
)(Overview);

//
// Export
//

module.exports = {
  MeasurementsReportPanel,
  SystemReportsSection,
  Overview,
  PilotReports,
};

