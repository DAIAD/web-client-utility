var React = require('react');
var bs = require('react-bootstrap');

var maximizable = Component => {
  var maximizableComponent = React.createClass({
    getInitialState: function() {
      return {
        maximized: false
      };
    },
    getDefaultProps: function() {
      return {
        maximizedStyle: {},
        maximizedProps: {}
      }
    },
    minimize: function() {
      this.setState({ maximized: false });
    },
    maximize: function() {
      this.setState({ maximized: true });
    },
    render: function() {
      const { maximized } = this.state;
      const { maximizedProps, maximizedStyle } = this.props;
      return (
        <div>
          <Component 
            {...this.props} 
            maximize={this.maximize} 
          />
          <bs.Modal
            animation={false} 
            dialogClassName='maximized-modal'
            show={maximized}
            onHide={this.minimize}
            >
            <bs.Modal.Body>
              <Component
                {...this.props}
                {...maximizedProps}
                maximized={maximized}
                minimize={this.minimize}
                style={{
                  height: '80vh',
                  width: '100%',
                  ...maximizedStyle
                }}
                />
              
            </bs.Modal.Body>
          </bs.Modal>
        </div>
      );
    }
  });
  return maximizableComponent;
}
module.exports = maximizable;
