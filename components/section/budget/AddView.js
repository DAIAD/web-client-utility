var React = require('react');
var bs = require('react-bootstrap');
var Modal = require('../../Modal');
//var Wizard = require('../../common/Wizard');
var Wizard = require('../../common/Wizard');
var { FormattedMessage } = require('react-intl');
var { SetNameItem, WhoItem, WhereItem, WhenItem, SelectBudgetType, SelectSavingsScenario, SetSavingsPercentageItem, SetGoalItem, DistributionItem  } = require('../../common/WizardReusableItems');

const validateBudgetType = ({value}) => {
  if (!value) {
    throw 'noBudget';
  }
}

const validateWho = (value) => {
  if ((!Array.isArray(value) && value.value !== 'all') || 
     (Array.isArray(value) && value.length == 0)) {
    throw 'noWho';
  }
};

const validateWhere = (value) => {
  if ((!Array.isArray(value) && value.value !== 'all') ||
     (Array.isArray(value) && value.length == 0)) {
       throw 'noWhere';
  }
};
const validateSavingsPercentage = ({value}) => {
  if (isNaN(value)) {
    throw 'notANumber';
  }
  else if (value <= 0 || value > 100) {
    throw 'notPercentage';
  }
};

const validateDistribution = ({value}) => {
  if (!value) {
    throw 'noDistribution';
  }
};
const validateGoal = ({value}) => {
  if (isNaN(value)) {
    throw 'notANumber';
  }
  else if (value <= 0 || value > 100) {
    throw 'notPercentage';
  }
};
const validateSavingsPotentialSelect = ({value}) => {
  if (!value) {
      throw 'noSavingsScenario';
  }
};

const validateName = function ({value}) { 
  const existing = this.props.budgets.map(budget => budget.name);

  if (!value) {
    throw 'noName';
  }
  else if (existing.includes(value)) {
    throw 'nameExists';
  }
};

var BudgetsAdd = React.createClass ({
  render: function() {
    const { groups, clusters, segments, areas, actions, wizardType, validationError, savings, intl } = this.props;
    const _t = intl.formatMessage;
    const { setValidationError, setAddBudgetWizardType, goToListView, addBudgetScenario } = actions;
    return (
      <bs.Panel header='Add new budget'>
        <bs.Row>
          <bs.Col md={6}>
          </bs.Col>
          <bs.Col md={6} style={{textAlign: 'right'}}>
            <bs.Button bsStyle='success' onClick={() => { goToListView(); }}><i className='fa fa-chevron-left'></i> Back to all</bs.Button>
          </bs.Col>
        </bs.Row>
        <hr/>
              <Wizard
                onComplete={(values) => { addBudgetScenario({...values}); goToListView();  }}
                validateLive
              >
                <SelectBudgetType
                  id='budgetType'
                  initialValue={{}}
                  intl={intl}
                  next={value => value.value === 'estimate' ? 'goal' : 'scenario'} 
                  validate={validateBudgetType}
                />
                <SelectSavingsScenario
                  id='scenario'
                  items={savings}
                  initialValue={{}}
                  validate={validateSavingsPotentialSelect}
                />
                <SetSavingsPercentageItem
                  id='savings'
                  initialValue={{value: 0, label: 0}}
                  validate={validateSavingsPercentage}
                  next={value => 'name'} 
                />
                <SetGoalItem
                  id='goal'
                  initialValue={{value: 0, label: 0}}
                  validate={validateGoal}
                />
                <DistributionItem
                  id='distribution'
                  intl={intl}
                  initialValue={{}}
                  validate={validateDistribution}
                />
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
                 clusters={segments}
                 groups={areas}
                 initialValue={{}}
                 validate={validateWhere}
                />
                <WhoItem
                  id='excludeWho'
                  intl={intl}
                  initialValue={{}}
                  groups={groups}
                  clusters={clusters}
                  noAll
                />
                <WhereItem
                  id='excludeWhere'
                  intl={intl}
                  initialValue={{}}
                  groups={areas}
                  clusters={segments}
                  noAll
                />
                <SetNameItem
                  id='name'
                  intl={intl}
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

module.exports = BudgetsAdd;
