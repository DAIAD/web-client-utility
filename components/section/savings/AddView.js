var React = require('react');
var bs = require('react-bootstrap');
var Modal = require('../../Modal');
var Wizard = require('../../wizard/Wizard');
var { SetName, SelectWho, SelectWhere, SelectWhen } = require('../../wizard/items/');
var util = require('../../../helpers/wizard');
var { nameToId, getFeature } = require('../../../helpers/common');

const initialEmpty = {};

const validateWho = (value) => {
  if ((!Array.isArray(value) && value.selected !== 'all') || 
      (Array.isArray(value) && value.length === 0)) {
    throw 'noWho';
  }
};

const validateWhere = value => {
  if ((!Array.isArray(value) && value.selected !== 'all') || 
     (Array.isArray(value) && value.length == 0)) {
    throw 'noWhere';
  }
};

const validateWhen = (value) => {
  if (!value || !value.start || !value.end) {
    throw 'noWhen';
  }
  else if (isNaN(Date.parse(new Date(value.start)))) {
    throw 'fromInvalid';
  }
  else if (isNaN(Date.parse(new Date(value.end)))) {
    throw 'toInvalid';
  }
  else if (value.start > value.end)  {
    throw 'fromAfterTo';
  }
  else if (value.end > new Date().valueOf()) {
    throw 'noFuture';
  }
};

const validateName = function (value) { 
  const existing = this.props.scenarios.map(scenario => scenario.name);
  if (!value.name) {
    throw 'noName';
  } else if (existing.includes(value.name)) {
    throw 'nameExists';
  }
};

var SavingsPotentialAdd = React.createClass({
  render: function() {
    const { utility, groups, clusters, actions, validationError, intl } = this.props;
    const { setValidationError, addSavingsScenario, goToListView, querySavingsScenarios } = actions;
    const _t = x => intl.formatMessage({ id: x });

    const areas =  this.props.areas.map(area => ({
      key: area.key,
      value: area.key,
      label: area.title,
      feature: getFeature(area),
    })); 

    return (
      <bs.Panel header={<h3>{_t('Savings.Add.title')}</h3>}>
        <bs.Row>
        <bs.Col md={12} style={{textAlign: 'right'}}>
          <bs.Button bsStyle='success' onClick={() => { goToListView(); }}><i className='fa fa-chevron-left'></i> Back to all</bs.Button>
        </bs.Col>
      </bs.Row>
      <hr/>
        <Wizard
          onComplete={(values) => { 
            addSavingsScenario(values);
            goToListView(); 
          }}
          validateLive
          childrenProps={{ intl }}
          > 
          <SelectWho
            id='population'
            title='Who'
            description='Select all population or narrow savings potential calculation to selected groupsn'
            utility={utility}
            clusters={clusters}
            initialValue={{}}
            validate={validateWho}
          />
          <SelectWhere
            id='spatial'
            title='Where'
            description='Select all areas or narrow savings potential calculation to selected areas'
            areas={areas}
            initialValue={{}}
            validate={validateWhere}
          />
          <SelectWhen
            id='time'
            title='Data'
            description='Data to be used for savings potential calculation, last year or custom'
            initialValue={{}}
            validate={validateWhen}
          />
          <SetName
            title='Name'
            description='Select a descriptive name for your scenario'
            id='title'
            initialValue=''
            validate={validateName.bind(this)}
          />
          <div
            id='confirmation'
            initialValue={{}}
          />
        </Wizard>
      </bs.Panel>
    );
  }
});

module.exports = SavingsPotentialAdd;
