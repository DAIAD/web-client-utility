var React = require('react');

var SystemSettings = React.createClass({
  contextTypes: {
      intl: React.PropTypes.object
  },

    render: function() {
      return (
      <div className="container-fluid" style={{ paddingTop: 10 }}>
      </div>
     );
    }
});

SystemSettings.icon = 'server';
SystemSettings.title = 'Settings.User';

module.exports = SystemSettings;
