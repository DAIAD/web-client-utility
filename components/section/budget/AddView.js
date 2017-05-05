var React = require('react');

var { connect } = require('react-redux');
var bs = require('react-bootstrap');
var Modal = require('../../Modal');
var { FormattedMessage } = require('react-intl');
var Wizard = require('../../wizard/Wizard');
var { SetName, SelectWho, SelectWhere, SelectWhen, SelectBudgetType, SelectSavingsScenario, SetSavingsPercentage, SetGoal, SelectDistribution  } = require('../../wizard/items/');
var { nameToId, getFeature } = require('../../../helpers/common');

const validateBudgetType = ({type:value}) => {
  if (!value) {
    throw 'noBudget';
  }
}

const validateWho = (value) => {
  if ((!Array.isArray(value) && value.selected !== 'all') || 
     (Array.isArray(value) && value.length == 0)) {
    throw 'noWho';
  }
};

const validateWhere = (value) => {
  if ((!Array.isArray(value) && value.selected !== 'all') ||
     (Array.isArray(value) && value.length == 0)) {
       throw 'noWhere';
  }
};
const validateSavingsPercentage = ({savings:value}) => {
  if (isNaN(value)) {
    throw 'notANumber';
  }
  else if (value <= 0 || value > 100) {
    throw 'notPercentage';
  }
};

const validateDistribution = ({type:value}) => {
  if (!value) {
    throw 'noDistribution';
  }
};

const validateGoal = ({goal:value}) => {
  if (isNaN(value)) {
    throw 'notANumber';
  }
  else if (value <= 0 || value > 100) {
    throw 'notPercentage';
  }
};

const validateSavingsScenario = ({key:value}) => {
  if (!value) {
      throw 'noSavingsScenario';
  }
};

const validateName = function ({name:value}) { 
  const existing = this.props.budgets.map(budget => nameToId(budget.name));

  if (!value) {
    throw 'noName';
  }
  else if (existing.includes(nameToId(value))) {
    throw 'nameExists';
  }
};

var BudgetsAdd = React.createClass ({
  componentWillMount: function () {
    this.props.actions.fetchCompletedSavingsScenarios(); 
  },
  render: function() {
    const { utility, groups, clusters, actions, wizardType, validationError, savings, intl } = this.props;
    const { setValidationError, setAddBudgetWizardType, goToListView, addBudget } = actions;
    const areas =  this.props.areas.map(area => ({
      key: area.key,
      value: area.key,
      label: area.title,
      feature: getFeature(area),
    })); 


    const savingsItems = savings
    //.filter(scenario => scenario.completedOn != null)
    .map(scenario => ({ 
        label: scenario.name, 
        value: scenario.key, 
        parameters: scenario.parameters 
    }));
    const _t = x => intl.formatMessage({ id: x });
    return (
      <bs.Panel header={<h3>{_t('Budgets.Add.title')}</h3>}>
        <bs.Row>
          <bs.Col md={6}>
          </bs.Col>
          <bs.Col md={6} style={{textAlign: 'right'}}>
            <bs.Button bsStyle='success' onClick={() => { goToListView(); }}><i className='fa fa-chevron-left'></i> Back to all</bs.Button>
          </bs.Col>
        </bs.Row>
        <hr/>
        
        <Wizard
          onComplete={(values) => { 
            addBudget(values); 
            goToListView();  
          }}
          validateLive
          childrenProps={{ intl }}
        >
          <SelectBudgetType
            id='budgetType'
            initialValue={{}}
            next={value => value.selected === 'estimate' ? 'goal' : 'scenario'} 
            validate={validateBudgetType}
          />
          <SelectSavingsScenario
            id='scenario'
            items={savingsItems}
            initialValue={{}}
            validate={validateSavingsScenario}
          />
          <SetSavingsPercentage
            id='savings'
            initialValue={{savings: 0}}
            validate={validateSavingsPercentage}
            next={value => 'title'} 
          />
          <SetGoal
            id='goal'
            initialValue={{goal: 0}}
            validate={validateGoal}
          />
          <SelectDistribution
            id='distribution'
            initialValue={{}}
            validate={validateDistribution}
          />
          <SelectWho
            id='population'
            utility={utility}
            groups={groups}
            clusters={clusters}
            initialValue={{}}
            validate={validateWho}
          />
          <SelectWhere
           id='spatial'
           areas={areas}
           initialValue={{}}
           validate={validateWhere}
          />
          <SelectWho
            id='excludePopulation'
            initialValue={{}}
            groups={groups}
            clusters={clusters}
            noAll
          />
          <SelectWhere
            id='excludeSpatial'
            areas={areas}
            initialValue={{}}
            noAll
          />
          <SetName
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

module.exports = BudgetsAdd;
