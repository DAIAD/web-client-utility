var React = require('react');
var bs = require('react-bootstrap');
var { FormattedMessage } = require('react-intl');

function DistributionItem (props) {
  const { value, setValue, intl } = props;
  const distributionItems = [
    {value: 'equally', label: intl.formatMessage({ id: 'Wizard.items.distribution.options.equally.value' })},
    {value: 'fairly', label: intl.formatMessage({ id: 'Wizard.items.distribution.options.fairly.value' })}
  ];
  return (
    <bs.Col md={5}>
      <bs.ButtonGroup vertical block>
      {
        distributionItems.map(item => 
          <bs.Button 
            key={item.value}
            bsSize='large'
            bsStyle={item.value === value.value ? 'primary' : 'default'} 
            style={{marginBottom: 10}} 
            onClick={() => setValue(item)}
            >
            <FormattedMessage id={`Wizard.items.distribution.options.${item.value}.label`} />
        </bs.Button>
        )
      }
      </bs.ButtonGroup>
    </bs.Col>
  );
}

module.exports = DistributionItem;
