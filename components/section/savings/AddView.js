var React = require('react');
var bs = require('react-bootstrap');
var Modal = require('../../Modal');
var Wizard = require('../../common/Wizard');
var { SetNameItem, WhoItem, WhereItem, WhenItem } = require('../../common/WizardReusableItems');
var util = require('../../../helpers/wizard');

const initialEmpty = {};

const validateWho = (value) => {
  if ((!Array.isArray(value) && value.value !== 'all') || 
      (Array.isArray(value) && value.length === 0)) {
    throw 'noWho';
  }
};

const validateWhere = value => {
  if ((!Array.isArray(value) && value.value !== 'all') || 
     (Array.isArray(value) && value.length == 0)) {
    throw 'noWhere';
  }
};

const validateWhen = ({timespan:value}) => {
  if (!value) {
    throw 'noWhen';
  }
  else if (value.length < 2 || value.length > 2) {
    throw 'noWhen';
  }
  else if (isNaN(Date.parse(new Date(value[0])))) {
    throw 'fromInvalid';
  }
  else if (isNaN(Date.parse(new Date(value[1])))) {
    throw 'toInvalid';
  }
  else if (value[0] > value[1]) {
    throw 'fromAfterTo';
  }
  else if (value[1] > new Date().valueOf()) {
    throw 'noFuture';
  }
};

const validateName = function (value) { 
  const existing = this.props.scenarios.map(scenario => scenario.name);

  if (!value.value) {
    throw 'noName';
  }
  else if (existing.includes(value.value)) {
    throw 'nameExists';
  }
};



var SavingsPotentialAdd = React.createClass ({
  render: function() {
    const { groups, clusters, segments, areas, actions, validationError, scenarios, intl } = this.props;
    const { addSavingsScenario, goToListView } = actions;
    return (
      <bs.Panel header='Add new scenario'>
        <bs.Row>
          <bs.Col sm={4} md={5}>
          </bs.Col>
        <bs.Col md={7} style={{textAlign: 'right'}}>
          <bs.Button bsStyle='success' onClick={() => { goToListView(); }}><i className='fa fa-chevron-left'></i> Back to all</bs.Button>
        </bs.Col>
      </bs.Row>
      <hr/>
        <Wizard
          onComplete={(values) => { addSavingsScenario(values); goToListView(); }}
          validateLive
          >
          <WhoItem
            id='who'
            intl={intl}
            groups={groups}
            clusters={clusters}
            initialValue={{}}
            validate={validateWho}
          />
          <WhereItem
            id='where'
            intl={intl}
            initialValue={{}}
            validate={validateWhere}
            clusters={segments}
            groups={areas}
          />
          <WhenItem
            id='when'
            intl={intl}
            initialValue={{}}
            validate={validateWhen}
          />
          <SetNameItem
            id='name'
            intl={intl}
            initialValue={{}}
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
