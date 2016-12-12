var React = require('react');
var { bindActionCreators } = require('redux');
var { connect } = require('react-redux');
var bs = require('react-bootstrap');
var { push } = require('react-router-redux');
var { injectIntl } = require('react-intl');

var Actions = require('../../../actions/SavingsActions');
var { getTimeline, getMetersLocations } = require('../../../actions/MapActions');

var Modal = require('../../Modal');
var Table = require('../../Table');
var util = require('../../../helpers/wizard');

var Breadcrumb = require('../../../components/Breadcrumb');


function SavingsPotential (props) {
  const { routes, children, actions, scenarioToRemove } = props;
  const { goToListView, confirmRemoveScenario, removeSavingsScenario } = actions;
  return (
    <div className='container-fluid' style={{ paddingTop: 10 }}>
      <div className='row'>
        <div className='col-md-12'>
          <Breadcrumb routes={routes}/>
        </div>
      </div>
      <div className='row'>
        <div className='col-md-12 col-sm-12' style={{marginTop: 10}}>
          {
            React.cloneElement(children, props)
          }
        </div>
  
        <RemoveConfirmation
          goToListView={goToListView}
          scenario={scenarioToRemove}
          removeSavingsScenario={removeSavingsScenario}
          confirmRemoveScenario={confirmRemoveScenario}
        />
      </div> 
    </div>
  );
}

//components used in more than one savings sub-sections

function RemoveConfirmation (props) {
  const { scenario, confirmRemoveScenario, removeSavingsScenario, goToListView } = props;
  const reset = () => confirmRemoveScenario(null);
  if (scenario == null) {
    return <div/>;
  }
  const { id, name } = scenario;
  return (
    <Modal
      title='Confirmation'
      show={true}
      text={<span>Are you sure you want to delete <b>{name}</b> (id:{id})</span>}
      onClose={reset}
      actions={[
        {
          name: 'Cancel',
          action: reset,
        },
        {
          name: 'Delete',
          action: () => { removeSavingsScenario(id); confirmRemoveScenario(null); goToListView(); },
          style: 'danger',
        },
      ]}
    />
  );
}
function mapStateToProps(state, ownProps) {
  return {
    routing: state.routing,
    user: state.session.profile ? {value: state.session.profile.username, label: state.session.profile.firstname + ' ' + state.session.profile.lastname} : null,
    clusters: state.config.utility.clusters,
    segments: [{
       key: 'area',
       name: 'Areas'
     }],
     scenarios: state.savings.scenarios.map(scenario => ({
       ...scenario, 
       paramsShort: util.getFriendlyParams(scenario.parameters, ownProps.intl, 'short')
       .map(x => <span><b>{x.key}</b> ({x.value}) &nbsp;</span>),
       params: util.getFriendlyParams(scenario.parameters, ownProps.intl, 'long')
     })),
     scenarioToRemove: state.savings.scenarios.find(s => s.id === state.savings.scenarioToRemove),
     searchFilter: state.savings.searchFilter,
     areas: state.map.map.areas,
     profile: state.session.profile,
     metersLocations: state.map.metersLocations,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions : {
      ...bindActionCreators({...Actions, getTimeline, getMetersLocations}, dispatch), 
      goToAddView: () => dispatch(push('/savings/add')),
      goToExploreView: (id) => dispatch(push(`/savings/${id}`)),
      goToListView: () => dispatch(push('/savings')),
    }
  };
}



const SavingsPotentialContainer = injectIntl(connect(mapStateToProps, mapDispatchToProps)(SavingsPotential));

SavingsPotentialContainer.icon = 'percent';
SavingsPotentialContainer.title = 'Section.Savings';

module.exports = SavingsPotentialContainer;
