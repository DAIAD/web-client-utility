var React = require('react');
var bs = require('react-bootstrap');
var { FormattedMessage } = require('react-intl');

function SelectBudgetType (props) {
  const { value, setValue, intl } = props;
  const budgetTypes = [
    {value: 'scenario', label: intl.formatMessage({ id: 'Wizard.items.budgetType.options.scenario.value' })}, 
    {value: 'estimate', label: intl.formatMessage({ id: 'Wizard.items.budgetType.options.estimate.value' })}
  ];
  return (
    <bs.Col md={4}>
      {
        budgetTypes.map(budget =>  
          <bs.Button 
            key={budget.value}
            bsStyle={budget.value === value.value ? 'primary' : 'default'} 
            bsSize='large' 
            style={{marginBottom: 10}} 
            onClick={() => setValue(budget)} 
            block
            >
            <FormattedMessage id={`Wizard.items.budgetType.options.${budget.value}.label`} />
          </bs.Button>
          )
      }
    </bs.Col>
  );
}

module.exports = SelectBudgetType; 
