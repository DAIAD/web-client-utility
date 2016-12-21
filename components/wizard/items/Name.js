var React = require('react');
var bs = require('react-bootstrap');

function SetNameItem (props) {
  const { value, setValue, intl } = props;
  return (
    <bs.Col md={5}>
      <bs.Input type="text" placeholder={intl.formatMessage({ id: 'Wizard.items.name.help' })} value={value.name} onChange={(e) => setValue({name: e.target.value, label: e.target.value })}/>
    </bs.Col>
  );
}

module.exports = SetNameItem; 
