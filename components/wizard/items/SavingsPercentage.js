var React = require('react');
var bs = require('react-bootstrap');
var { FormattedMessage } = require('react-intl');

function SetSavingsPercentageItem (props) {
  const { value, setValue } = props;
  return (
    <div>
      <bs.Col md={5}>
        <bs.Input 
          type='number'
          min='0'
          max='100'
          step='0.01'
          value={value.savings} 
          bsSize='large'
          style={{ float: 'left', width: '60%', height: '100%', fontSize: '2.8em' }} 
          onChange={(e) => setValue({savings: parseFloat(e.target.value), label: '-' + e.target.value + '%'})}
        />
      <span style={{ float: 'left', marginLeft: 10, fontSize: '1.8em' }}>%</span>
    </bs.Col>
    <bs.Col md={6} style={{ textAlign: 'left' }}>
      <h3><FormattedMessage id='Wizard.items.savings.help' /></h3>
    </bs.Col>
    </div>
  );
}

module.exports = SetSavingsPercentageItem;
