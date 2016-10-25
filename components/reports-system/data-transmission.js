var _ = require('lodash');

var React = require('react');
var ReactBootstrap = require('react-bootstrap');

var PropTypes = React.PropTypes;
var commonPropTypes = {
  level: PropTypes.string.isRequired,
  reportName: PropTypes.string.isRequired,
};

var Report = React.createClass({
  statics: {
  },

  propTypes: _.extend({}, commonPropTypes),

  render: function () {
    return (
      <div>Todo report</div>
    );
  },
});

module.exports = {Report};
