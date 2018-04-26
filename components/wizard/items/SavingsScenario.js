var React = require('react');
var bs = require('react-bootstrap');
var Select = require('react-select').default;


function SelectSavingsScenario (props) {
  const { value, setValue, items } = props;
  return (
    <bs.Col md={5}>
      <Select
        bsSize="large"
        name='scenario-select'
        multi={false}
        options={items}
        value={{ label: value.label, value: value.key }}
        onChange={(val) => { return val != null ? setValue({ key: val.value, label: val.label }) : setValue({}) }}
      />
    </bs.Col>
  );
}

module.exports = SelectSavingsScenario; 
