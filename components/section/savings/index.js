var React = require('react');
var { bindActionCreators } = require('redux');
var { connect } = require('react-redux');
var bs = require('react-bootstrap');
var { push } = require('react-router-redux');
var { injectIntl } = require('react-intl');

var Actions = require('../../../actions/SavingsActions');
var { getTimeline, getMetersLocations } = require('../../../actions/MapActions');

var Modal = require('../../Modal');
var util = require('../../../helpers/wizard');

var Breadcrumb = require('../../../components/Breadcrumb');

const SPATIAL_CLUSTERS = [{
  key: 'area',
  name: 'Areas'
}];

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
      className='confirmation-modal'
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
    viewportWidth: state.viewport.width,
    viewportHeight: state.viewport.height,
    profile: state.session.profile,
    utility: state.config.utility.key,
    clusters: state.config.utility.clusters,
    segments: SPATIAL_CLUSTERS,
    scenarios: state.savings.scenarios,
    scenarioToRemove: state.savings.scenarios.find(s => s.id === state.savings.scenarioToRemove),
    searchFilter: state.savings.searchFilter,
    areas: state.map.map.areas,
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

function mergeProps(stateProps, dispatchProps, ownProps) {
  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    user: stateProps.profile ? {value: stateProps.profile.username, label: stateProps.profile.firstname + ' ' + stateProps.profile.lastname} : null,
    scenarios: stateProps.scenarios.map(scenario => ({
      ...scenario, 
      paramsShort: util.getFriendlyParams(scenario.parameters, ownProps.intl, 'short'),
      params: util.getFriendlyParams(scenario.parameters, ownProps.intl, 'long')
    })),
  };
}



const SavingsPotentialContainer = injectIntl(connect(mapStateToProps, mapDispatchToProps, mergeProps)(SavingsPotential));

SavingsPotentialContainer.icon = 'percent';
SavingsPotentialContainer.title = 'Section.Savings';

module.exports = SavingsPotentialContainer;
