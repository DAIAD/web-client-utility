var React = require('react');
var { bindActionCreators } = require('redux');
var { connect } = require('react-redux');
var bs = require('react-bootstrap');
var { Link } = require('react-router');
var { push } = require('react-router-redux');
var util = require('../../../helpers/wizard');
var { injectIntl, FormattedDate } = require('react-intl');

var Modal = require('../../Modal');
var Table = require('../../Table');
var Actions = require('../../../actions/BudgetActions');
var { getTimeline, getMetersLocations } = require('../../../actions/MapActions');

var Breadcrumb = require('../../../components/Breadcrumb');

var Budgets = React.createClass({ 
  render: function() {
    const { routes, children, budgetToRemove, actions, clusters, groups, segments, budgets } = this.props;
    const { removeBudgetScenario, confirmRemoveBudgetScenario, goToListView } = actions;
    return (
			<div className='container-fluid' style={{ paddingTop: 10 }}>
				<div className='row'>
					<div className='col-md-12'>
            <Breadcrumb routes={routes}/>
          </div>
        </div>
        <div className='row'>
          <div className='col-md-12' style={{marginTop: 10}}>
            {
              React.cloneElement(children, { clusters, groups, segments, budgets, actions })
            }
          </div>
          
          <RemoveConfirmation
            goToListView={goToListView}
            scenario={budgetToRemove}
            removeScenario={removeBudgetScenario}
            confirmRemoveScenario={confirmRemoveBudgetScenario}
          />
        </div>
      </div>
    );
  }
});

//common components for more than one budget sub-sections
function RemoveConfirmation (props) {
  const { scenario, confirmRemoveScenario, removeScenario, goToListView } = props;
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
          action: () => { removeScenario(id); confirmRemoveScenario(null); goToListView(); },
          style: 'danger',
        },
      ]}
    />
  );
}

//mockup values for spatial clusters/groups
function mapStateToProps(state) {
  return {
    //common
    routing: state.routing,
    clusters: !state.config.utility.clusters ? [] :
      state.config.utility.clusters.map(cluster => ({
        label: cluster.name,
        value: cluster.key
      })),
    groups: !state.config.utility.clusters ? [] :
      state.config.utility.clusters
      .reduce((p, c) => [...p, ...c.groups.map(
        g => ({
          value: c.name + ':' + g.name,
          cluster: g.clusterKey,
          group: g.key,
          label: c.name + ': ' + g.name
        }))], [])
        .sort((s1, s2) => (s2.label == s1.label) ? 0 : ((s2.label < s1.label) ? 1 : -1)),
     segments: [{
       value: 'area',
       label: 'Areas'
     }],
     budgets: state.budget.scenarios.map(scenario => ({
       ...scenario, 
       active: scenario.activatedOn != null,
       paramsShort: util.getFriendlyParams(scenario.parameters, 'short')
        .map(x => `${x.key}: ${x.value}`).join(', '),
       paramsLong: util.getFriendlyParams(scenario.parameters, 'long')
       .map(x => `${x.key}: ${x.value}`).join(', '),
       params: util.getFriendlyParams(scenario.parameters, 'long')
     })),
     budgetToRemoveIdx: state.budget.budgetToRemove,
     //list
     searchFilter: state.budget.searchFilter,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions : {
      ...bindActionCreators({...Actions, getTimeline, getMetersLocations}, dispatch), 
      goToAddView: () => dispatch(push('/budgets/add')),
      goToExploreView: (id) => dispatch(push(`/budgets/${id}`)),
      goToListView: () => dispatch(push('/budgets')),
      goToActiveView: () => dispatch(push('/budgets/active'))   
    }
  };
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  return {
    ...ownProps,
    ...dispatchProps,
    ...stateProps,
    budgetToRemove: stateProps.budgets.find(scenario => scenario.id === stateProps.budgetToRemoveIdx),

  };
}

Budgets.icon = 'percent';
Budgets.title = 'Section.Budget';

const BudgetContainer = connect(mapStateToProps, mapDispatchToProps, mergeProps)(Budgets);
module.exports = injectIntl(BudgetContainer);
