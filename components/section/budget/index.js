var React = require('react');
var { bindActionCreators } = require('redux');
var { connect } = require('react-redux');
var bs = require('react-bootstrap');
var { Link } = require('react-router');
var { push } = require('react-router-redux');
var util = require('../../../helpers/wizard');
var { injectIntl, FormattedDate } = require('react-intl');

var Table = require('../../../components/Table');
var Actions = require('../../../actions/BudgetActions');
var { getTimeline } = require('../../../actions/MapActions');

var Breadcrumb = require('../../../components/Breadcrumb');

var Budgets = React.createClass({ 
  render: function() {
    return (
			<div className='container-fluid' style={{ paddingTop: 10 }}>
				<div className='row'>
					<div className='col-md-12'>
            <Breadcrumb routes={this.props.routes}/>
          </div>
        </div>
        <div className='row'>
          <div className='col-md-12' style={{marginTop: 10}}>
            {
              React.cloneElement(this.props.children, this.props)
            }
          </div>
        </div>
      </div>
    );
  }
});

//mockup values for spatial clusters/groups
function mapStateToProps(state) {
  return {
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
       label: 'Area'
     }],
     validationError: state.budget.validationError,
     budgetToRemoveIdx: state.budget.budgetToRemove,
     confirmSetBudgetIdx: state.budget.confirmSetBudget,
     confirmResetBudgetIdx: state.budget.confirmResetBudget,
     searchFilter: state.budget.searchFilter,
     savings: state.savings.scenarios,
     budgets: state.budget.scenarios.map(scenario => ({
       ...scenario, 
       active: scenario.activatedOn != null,
       paramsShort: util.getFriendlyParams(scenario.parameters, 'short')
        .map(x => `${x.key}: ${x.value}`).join(', '),
       paramsLong: util.getFriendlyParams(scenario.parameters, 'long')
       .map(x => `${x.key}: ${x.value}`).join(', '),
       params: util.getFriendlyParams(scenario.parameters, 'long')
     })),
     wizardType: state.budget.wizardType,
     initialActiveIdx: state.budget.initialActiveIdx,
     areas: state.map.map.areas,
     profile: state.session.profile,

  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions : {
      ...bindActionCreators({...Actions, getTimeline}, dispatch), 
      goToAddView: () => dispatch(push('/budgets/add')),
      goToExploreView: (id) => dispatch(push(`/budgets/${id}`)),
      goToListView: () => dispatch(push('/budgets')),
      goToActiveView: () => dispatch(push('/budgets/active'))   
    }
  };
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  
  const filteredBudgets = stateProps.searchFilter ? stateProps.budgets.filter(s => matches(s.name, stateProps.searchFilter) || matches(s.user, stateProps.searchFilter)) : stateProps.budgets;

  //all budgets table schema
  const budgetFields = [{
      name: 'id',
      title: 'Id',
      hidden: true
    }, 
    {
      name: 'name',
      title: 'Name',
      style: {
        width: 100
      },
      link: function(row) {
        if(row.id) {
          return '/budgets/{id}/';
        }
        return null;
      },
    }, 
    {
      name: 'active',
      title: 'Active',
      type: 'action',
      style: {
        textAlign: 'center',
        fontSize: '1.2em'
      },
      icon: function(field, row) {
        return row.active ? 'check' : '';
      },
      handler: null, 
    }, 
    {
      name: 'paramsShort',
      title: 'Parameters',
    },
    {
      name: 'user',
      title: 'User',
    },
    {
      name: 'createdOn',
      title: 'Created',
      type: 'datetime',
    }, 
    {
      name: 'completedOn',
      title: 'Finished',
      type: 'datetime',
    }, 
    {
      name: 'activatedOn',
      title: 'Activated',
      type: 'datetime',
    },
    {
      name : 'explore',
      title: 'Explore',
      type : 'action',
      icon : 'info-circle',
      style: {
        textAlign: 'center',
        fontSize: '1.3em'
      },
      handler : (function(field, row) {
        dispatchProps.actions.goToExploreView(row.id);
      }),
      visible : (function(field, row) {
        return true;
      })
    }, 
    {
      name : 'delete',
      title: 'Delete',
      type : 'action',
      icon : 'remove',
      handler : (function(field, row) {
        dispatchProps.actions.confirmRemoveBudgetScenario(row.id);
      }),
      visible : true 
    }];

    const budgetData = filteredBudgets || [];

    const budgetSorter = {
      defaultSort: 'completedOn',
      defaultOrder: 'desc'
    };

    const activeBudgets = stateProps.budgets.filter(b => b.active);

    //active budgets schema
    const activeBudgetsFields = [
      {
        name: 'id',
        title: 'id',
        hidden: true
      },
      {
        name: 'name',
        title: 'Name',
        hidden: true,
      },
      {
        name: 'activatedOn', 
        title: 'Activated', 
        type: 'datetime',
        hidden: true,
      },
      {
        name: 'goal',
        title: 'Goal',
        type: 'element',
        style: {
          height: 150
        }
      },
      {
        name: 'savings',
        title: 'Savings',
        type: 'element',
        style: {
          height: 150
        }
      },
      {
        name: 'affected',
        title: 'Affected',
        type: 'element',
        style: {
          height: 150
        }
      }];

      //const activeBudgetsData = active || [];
    
    const activeBudgetsSorter = {
      defaultSort: 'activatedOn',
      defaultOrder: 'desc'
    };

    var activeBudgetsStyle = {
      row: {
        height: 200
      }
    };

    return {
      ...ownProps,
      ...dispatchProps,
      ...stateProps,
      filteredBudgets,
      budgetFields,
      budgetData,
      budgetSorter,
      activeBudgetsFields,
      activeBudgets,
      activeBudgetsSorter,
      activeBudgetsStyle,
      budgetToRemove: stateProps.budgets.find(scenario => scenario.id === stateProps.budgetToRemoveIdx),
      budgetToSet: stateProps.budgets.find(scenario => scenario.id === stateProps.confirmSetBudgetIdx),
      budgetToReset: stateProps.budgets.find(scenario => scenario.id === stateProps.confirmResetBudgetIdx),
      //exploreScenario: stateProps.scenarios.find(scenario => scenario.id === stateProps.exploreId)
    };
}
function matches(str1, str2) {
  return str1.toLowerCase().indexOf(str2.toLowerCase()) != -1;
}

Budgets.icon = 'percent';
Budgets.title = 'Section.Budget';

const BudgetContainer = connect(mapStateToProps, mapDispatchToProps, mergeProps)(Budgets);
module.exports = injectIntl(BudgetContainer);
