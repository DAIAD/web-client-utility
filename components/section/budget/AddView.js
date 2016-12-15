var React = require('react');
var { connect } = require('react-redux');
var bs = require('react-bootstrap');
var Modal = require('../../Modal');
var { FormattedMessage } = require('react-intl');
var Wizard = require('../../wizard/Wizard');
var { SetName, SelectWho, SelectWhere, SelectWhen, SelectBudgetType, SelectSavingsScenario, SetSavingsPercentage, SetGoal, SelectDistribution  } = require('../../wizard/items/');
var { nameToId } = require('../../../helpers/common');

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
  const existing = this.props.budgets.map(budget => nameToId(budget.name));

  if (!value) {
    throw 'noName';
  }
  else if (existing.includes(nameToId(value))) {
    throw 'nameExists';
  }
};

var BudgetsAdd = React.createClass ({
  componentWillMount: function() {

    //TODO: temp way to load areas in state
    const utility = this.props.profile.utility;
    if(!this.props.areas) {
      const population = {
          utility: utility.key,
          label: utility.name,
          type: 'UTILITY'
      };
      this.props.actions.getTimeline(population);
    }
  },
//TODO: have to create geojson from areas object since API not ready yet
  getGeoJSON: function(areasObj) {
    if (!areasObj) return {};
    const areas = Object.keys(areasObj).map(key => areasObj[key]);
    return {
      type : 'FeatureCollection',
      features : areas.map(area => ({
        'type' : 'Feature',
        'geometry' : area.geometry,
        'properties' : {
          'label' : area.label,
          'cluster': 'area'
        }
      })),
      crs : {
        type : 'name',
        properties : {
          name : 'urn:ogc:def:crs:OGC:1.3:CRS84'
        }
      }
    };
  },

  render: function() {
    const { groups, clusters, segments, areas, actions, wizardType, validationError, savings, intl } = this.props;
    const { setValidationError, setAddBudgetWizardType, goToListView, addBudgetScenario } = actions;
    const geojson = this.getGeoJSON(areas);

    const savingsItems = savings.filter(scenario => scenario.completedOn != null)
    .map(scenario => ({ 
        label: scenario.name, 
        value: scenario.id, 
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
          onComplete={(values) => { addBudgetScenario({...values}); goToListView();  }}
          validateLive
          childrenProps={{ intl }}
        >
          <SelectBudgetType
            id='budgetType'
            initialValue={{}}
            next={value => value.value === 'estimate' ? 'goal' : 'scenario'} 
            validate={validateBudgetType}
          />
          <SelectSavingsScenario
            id='scenario'
            items={savingsItems}
            initialValue={{}}
            validate={validateSavingsPotentialSelect}
          />
          <SetSavingsPercentage
            id='savings'
            initialValue={{value: 0, label: 0}}
            validate={validateSavingsPercentage}
            next={value => 'name'} 
          />
          <SetGoal
            id='goal'
            initialValue={{value: 0, label: 0}}
            validate={validateGoal}
          />
          <SelectDistribution
            id='distribution'
            initialValue={{}}
            validate={validateDistribution}
          />
          <SelectWho
            id='who'
            groups={groups}
            clusters={clusters}
            initialValue={{}}
            validate={validateWho}
          />
          <SelectWhere
           id='where'
           clusters={segments.map(segment => ({ 
             ...segment, 
             groups: geojson.features ? geojson.features.map(f => ({ 
                feature: f,
                clusterKey: f.properties.cluster, 
                name: f.properties.label, 
                key: f.properties.label 
              })) : [] 
            }))}
           initialValue={{}}
           validate={validateWhere}
          />
          <SelectWho
            id='excludeWho'
            initialValue={{}}
            groups={groups}
            clusters={clusters}
            noAll
          />
          <SelectWhere
            id='excludeWhere'
            clusters={segments.map(segment => ({ 
             ...segment, 
             groups: geojson.features ? geojson.features.map(f => ({ 
                feature: f,
                clusterKey: f.properties.cluster, 
                name: f.properties.label, 
                key: f.properties.label 
              })) : [] 
            }))}
            initialValue={{}}
            noAll
          />
          <SetName
            id='name'
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

function mapStateToProps(state) {
  return {
    savings: state.savings.scenarios,
    areas: state.map.map.areas,
    profile: state.session.profile,
  };
}

module.exports = connect(mapStateToProps)(BudgetsAdd);
