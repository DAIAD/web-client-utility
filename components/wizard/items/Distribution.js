var React = require('react');
var bs = require('react-bootstrap');
var { FormattedMessage } = require('react-intl');

function DistributionItem (props) {
  const { value, setValue, intl } = props;
  const distributionItems = [
    {selected: 'equally', type: 'EQUALLY', label: intl.formatMessage({ id: 'Wizard.items.distribution.options.equally.value' })},
    {selected: 'fairly', type: 'FAIRLY', label: intl.formatMessage({ id: 'Wizard.items.distribution.options.fairly.value' })}
  ];
  return (
    <bs.Col md={5}>
      <bs.ButtonGroup vertical block>
      {
        distributionItems.map(item => 
          <bs.Button 
            key={item.selected}
            bsSize='large'
            bsStyle={item.selected === value.selected ? 'primary' : 'default'} 
            style={{marginBottom: 10}} 
            onClick={() => setValue(item)}
            >
            <FormattedMessage id={`Wizard.items.distribution.options.${item.selected}.label`} />
        </bs.Button>
        )
      }
      </bs.ButtonGroup>
    </bs.Col>
  );
}

module.exports = DistributionItem;
