var React = require('react');
var bs = require('react-bootstrap');
var { FormattedMessage } = require('react-intl');

function SelectBudgetType (props) {
  const { value, setValue, intl } = props;
  const budgetTypes = [
    {selected: 'scenario', type: 'SCENARIO', label: intl.formatMessage({ id: 'Wizard.items.budgetType.options.scenario.value' }) }, 
    {selected: 'estimate', type: 'GOAL', label: intl.formatMessage({ id: 'Wizard.items.budgetType.options.estimate.value' }) }
  ];
  return (
    <bs.Col md={6}>
      {
        budgetTypes.map(budget =>  
          <bs.Button 
            key={budget.selected}
            bsStyle={budget.selected === value.selected ? 'primary' : 'default'} 
            bsSize='large' 
            style={{marginBottom: 10}} 
            onClick={() => setValue(budget)} 
            block
            >
            <FormattedMessage id={`Wizard.items.budgetType.options.${budget.selected}.label`} />
          </bs.Button>
          )
      }
    </bs.Col>
  );
}

module.exports = SelectBudgetType; 
