var React = require('react');
var bs = require('react-bootstrap');

function SetGoalItem (props) {
  const { value, setValue } = props;
  return (
    <bs.Col md={5}>
      <span style={{ float: 'left', fontSize: '3em', height: '100%', marginRight: 10 }}>-</span>
      <bs.Input 
        type="number" 
        min='0'
        max='100'
        step='0.01'
        value={parseFloat(value.goal).toFixed(2)} 
        bsSize="large" 
        style={{ float: 'left', width: '60%', height: '100%', fontSize: '2.8em' }} 
        onChange={(e) => setValue({goal: parseFloat(e.target.value), label: '-' + e.target.value + '%'})}
      />
      <span style={{ float: 'left', marginLeft: 10, fontSize: '2.2em' }}>%</span>
    </bs.Col>
  );
}

module.exports = SetGoalItem;
