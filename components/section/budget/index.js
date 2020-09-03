var React = require('react');
var { bindActionCreators } = require('redux');
var { connect } = require('react-redux');
var moment = require('moment');
var { push } = require('react-router-redux');
var util = require('../../../helpers/wizard');
var { injectIntl } = require('react-intl');

var Modal = require('../../Modal');
var Actions = require('../../../actions/BudgetActions');
var { fetchAllAreas } = require('../../../actions/SavingsActions');

var Budgets = React.createClass({
  componentWillMount: function () {
    this.props.actions.fetchAllAreas();
    this.props.actions.fetchCompletedSavingsScenarios();
    this.props.actions.fetchBudgets();
  },
  render: function () {
    const { children, budgetToRemove, actions } = this.props;
    const { removeBudget, confirmRemoveBudgetScenario, goToListView } = actions;

    return (
      <div className='container-fluid' style={{ paddingTop: 10 }}>
        <div className='row'>
          <div className='col-md-12' style={{ marginTop: 10 }}>
            {
              React.cloneElement(children, this.props)
            }
          </div>

          <RemoveConfirmation
            goToListView={goToListView}
            scenario={budgetToRemove}
            removeScenario={removeBudget}
            confirmRemoveScenario={confirmRemoveBudgetScenario}
          />
        </div>
      </div>
    );
  }
});

//common components for more than one budget sub-sections
function RemoveConfirmation(props) {
  const { scenario, confirmRemoveScenario, removeScenario, goToListView } = props;
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
          action: () => { removeScenario(key); confirmRemoveScenario(null); goToListView(); },
          style: 'danger',
        },
      ]}
    />
  );
}

//mockup values for spatial clusters/groups
function mapStateToProps(state, ownProps) {
  return {
    //common
    routing: state.routing,
    clusters: state.config.utility.clusters,
    savings: state.budget.savings,
    query: state.budget.query,
    areas: state.savings.areas,
    budgets: state.budget.budgets,
    active: state.budget.active,
    budgetToRemoveIdx: state.budget.budgetToRemove,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    ...bindActionCreators({ ...Actions, fetchAllAreas }, dispatch),
    goToAddView: () => dispatch(push('/budgets/add')),
    goToExploreView: (key) => dispatch(push(`/budgets/${key}`)),
    goToListView: () => dispatch(push('/budgets')),
    goToActiveView: () => dispatch(push('/budgets/active'))
  };
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  const areas = Array.isArray(stateProps.areas) && stateProps.areas.length > 0 && stateProps.areas[0] || [];
  const savings = stateProps.savings;
  const lastMonth = moment().subtract(1, 'month');
  return {
    ...ownProps,
    actions: {
      ...dispatchProps,
      addBudget: data => dispatchProps.addBudget(data)
        .then(() => dispatchProps.fetchBudgets()),
      removeBudget: key => dispatchProps.removeBudget(key)
        .then(() => dispatchProps.fetchBudgets()),
      setActiveBudget: key => dispatchProps.setActiveBudget(key)
        .then(() => dispatchProps.fetchBudgets()),
      resetActiveBudget: key => dispatchProps.resetActiveBudget(key)
        .then(() => dispatchProps.fetchBudgets()),
      scheduleBudget: (budget, year, month) => dispatchProps.scheduleBudget(budget, lastMonth.year(), lastMonth.month() + 1)
        .then(() => setTimeout(dispatchProps.fetchBudgets, 2000)),
    },
    ...stateProps,
    areas,
    budgets: stateProps.budgets
      .map(scenario => ({
        ...scenario,
        parameters: util.getParamsWithLabels(util.flattenBudgetParams(scenario.parameters), { ...stateProps, areas, savings, intl: ownProps.intl }),
      }))
      .map(scenario => ({
        ...scenario,
        paramsShort: util.getFriendlyParams(scenario.parameters, ownProps.intl, 'short'),
        params: util.getFriendlyParams(scenario.parameters, ownProps.intl, 'long')
      })),
    budgetToRemove: stateProps.budgets.find(scenario => scenario.key === stateProps.budgetToRemoveIdx),

  };
}

const BudgetsContainer = injectIntl(connect(mapStateToProps, mapDispatchToProps, mergeProps)(Budgets));

BudgetsContainer.icon = 'percent';
BudgetsContainer.title = 'Section.Budget';

module.exports = BudgetsContainer;
