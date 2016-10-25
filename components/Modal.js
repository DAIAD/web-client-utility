var React = require('react');
var Bootstrap = require('react-bootstrap');

var Modal = React.createClass({

  getDefaultProps: function() {
    return {
      backdrop: true,
    };
  },  
	render: function(){
		return (
      <Bootstrap.Modal 
        animation={false} 
        show={this.props.show} 
        backdrop={this.props.backdrop}
        onHide={this.props.onClose} >
				<Bootstrap.Modal.Header closeButton>
					<Bootstrap.Modal.Title>{this.props.title}</Bootstrap.Modal.Title>
				</Bootstrap.Modal.Header>
				<Bootstrap.Modal.Body>
					{this.props.text}
				</Bootstrap.Modal.Body>
				<Bootstrap.Modal.Footer>
          {
            this.props.actions.map(action => 
              <Bootstrap.Button key={action.name} bsStyle={action.style || 'default'} onClick={action.action}>{action.name}</Bootstrap.Button>
            )
          }
				</Bootstrap.Modal.Footer>
			</Bootstrap.Modal>
		);
	}
});

module.exports = Modal;
