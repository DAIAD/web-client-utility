var React = require('react');
var { bindActionCreators } = require('redux');
var { connect } = require('react-redux');

var { push } = require('react-router-redux');
var { injectIntl } = require('react-intl');

var Actions = require('../../../actions/SavingsActions');
var { getTimeline, getMetersLocations } = require('../../../actions/MapActions');
var Modal = require('../../Modal');
var util = require('../../../helpers/wizard');


const SavingsPotential = React.createClass({
  componentWillMount: function () {
    this.props.actions.querySavingsScenarios();
    this.props.actions.fetchAllAreas();
  },
  render: function () {
    const { children, actions, scenarios, scenarioToRemove: scenarioToRemoveKey } = this.props;
    const { goToListView, removeSavingsScenario, confirmRemoveScenario } = actions;
    const scenarioToRemove = scenarios.find(scenario => scenario.key === scenarioToRemoveKey);

    return (
      <div className='container-fluid' style={{ paddingTop: 10 }}>
        <div className='row'>
          <div className='col-md-12 col-sm-12' style={{ marginTop: 10 }}>
            {
              React.cloneElement(children, this.props)
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
  },
});

//components used in more than one savings sub-sections

function RemoveConfirmation(props) {
  const { scenario, confirmRemoveScenario, removeSavingsScenario, goToListView } = props;
  const reset = () => confirmRemoveScenario(null);
  if (scenario == null) {
    return <div />;
  }
  const { key, name } = scenario;
  return (
    <Modal
      title='Confirmation'
      className='confirmation-modal'
      show={true}
      text={<span>Are you sure you want to delete <b>{name}</b> ({key})</span>}
      onClose={reset}
      actions={[
        {
          name: 'Cancel',
          action: reset,
        },
        {
          name: 'Delete',
          action: () => {
            removeSavingsScenario(key);
            confirmRemoveScenario(null);
            goToListView();
          },
          style: 'danger',
        },
      ]}
    />
  );
}

function mapStateToProps(state, ownProps) {
  return {
    ...state.savings,
    routing: state.routing,
    viewportWidth: state.viewport.width,
    viewportHeight: state.viewport.height,
    profile: state.session.profile,
    utility: state.config.utility.key,
    clusters: state.config.utility.clusters,
    metersLocations: state.map.metersLocations,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    ...bindActionCreators({ ...Actions, getTimeline, getMetersLocations }, dispatch),
    goToAddView: () => dispatch(push('/savings/add')),
    goToExploreView: (id) => dispatch(push(`/savings/${id}`)),
    goToListView: () => dispatch(push('/savings')),
  };
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  const areas = Array.isArray(stateProps.areas) && stateProps.areas.length > 0 && stateProps.areas[0] || [];
  return {
    ...stateProps,
    actions: {
      ...dispatchProps,
      addSavingsScenario: data => dispatchProps.addSavingsScenario(data)
        .then(() => dispatchProps.querySavingsScenarios()),
      removeSavingsScenario: key => dispatchProps.removeSavingsScenario(key)
        .then(() => dispatchProps.querySavingsScenarios()),
      refreshSavingsScenario: key => dispatchProps.refreshSavingsScenario(key)
        .then(() => dispatchProps.querySavingsScenarios())
        .then(() => setTimeout(dispatchProps.querySavingsScenarios, 2000)),
    },
    ...ownProps,
    areas,
    user: stateProps.profile ? { value: stateProps.profile.username, label: stateProps.profile.firstname + ' ' + stateProps.profile.lastname } : null,
    scenarios: stateProps.scenarios
      .map(scenario => ({
        ...scenario,
        parameters: util.getParamsWithLabels(scenario.parameters, { ...stateProps, areas, intl: ownProps.intl }),
      }))
      .map(scenario => ({
        ...scenario,
        potential: Math.round(scenario.potential / 100) / 10,
        paramsShort: util.getFriendlyParams(scenario.parameters, ownProps.intl, 'short'),
        params: util.getFriendlyParams(scenario.parameters, ownProps.intl, 'long')
      })),
  };
}



const SavingsPotentialContainer = injectIntl(connect(mapStateToProps, mapDispatchToProps, mergeProps)(SavingsPotential));

SavingsPotentialContainer.icon = 'percent';
SavingsPotentialContainer.title = 'Section.Savings';

module.exports = SavingsPotentialContainer;
