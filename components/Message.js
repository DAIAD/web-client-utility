var React = require('react');
var FormattedMessage = require('react-intl').FormattedMessage;

var Message = React.createClass({
  contextTypes: {
      intl: React.PropTypes.object
  },

  propTypes : {
    text : React.PropTypes.string,
    image : React.PropTypes.string,
    color: React.PropTypes.string
  },

  getDefaultProps: function() {
    return {
      text: '',
      image: '',
      color: '#5bc0de'
      };
  },

    render: function() {
      return (
      <div style={{   borderRadiusRight: 3,
              borderLeft: '5px solid ' + this.props.color}}>
        <div style={{   borderRadiusRight: 3,
          borderLeft: '0px none !important',
          border: '1px solid #F5F5F5',
          padding: 10 }}>
          <FormattedMessage
            id={this.props.text}
          />
        </div>
      </div>
     );
    }
});

module.exports = Message;
