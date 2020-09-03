var React = require('react');
var Redux = require('react-redux');

var { MeasurementsReportPanel } = require('../../reports');

var PropTypes = React.PropTypes;
var { configPropType } = require('../../../prop-types');

var Page = React.createClass({
  displayName: 'Analytics.ReportPanel',

  propTypes: {
    routes: PropTypes.array, // supplied by react-router
    config: configPropType,
  },

  contextTypes: {
    intl: React.PropTypes.object
  },

  render: function () {
    var { config } = this.props;
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12">
            <MeasurementsReportPanel config={config} />
          </div>
        </div>
      </div>
    );
  },

});

Page.icon = 'pie-chart';
Page.title = 'Section.Analytics.ReportPanel';

function mapStateToProps(state, ownProps) {
  return {
    config: state.config,
  };
}

function mapDispatchToProps(dispatch, ownProps) {
  return {};
}

module.exports = Redux.connect(mapStateToProps, mapDispatchToProps)(Page);
