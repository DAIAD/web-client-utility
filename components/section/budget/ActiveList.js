var React = require('react');
var { bindActionCreators } = require('redux');
var { connect } = require('react-redux');
var bs = require('react-bootstrap');
var { Link } = require('react-router');
var Table = require('../../Table');

//var Table = require('../Table');
//var BudgetActions = require('../../actions/BudgetActions');
//var Breadcrumb = require('../Breadcrumb');
//var Wizard = require('../WizardComponent');
//var { WhoItem, WhereItem, DistributionItem, SetGoalItem, SelectSavingsPotentialItem, SetSavingsPercentageItem, SelectBudgetType } = require('../WizardReusableItems');

var { WidgetPanel } = require('../../WidgetComponent');


var ActiveBudgets = React.createClass({ 
  render: function() {
    const { mode, groups, clusters, segments, areas, savings, errorModal, removeConfirmation, validationError, activeBudget, activeBudgetsFields, activeBudgetsData, tableStyle, searchFilter, budgetType, activeBudgetsStyle } = this.props;
    const { setErrorModal, resetErrorModal, setValidationError, switchMode, addBudgetScenario, removeBudgetScenario, toggleRemoveConfirmation, setSearchFilter, setBudgetType } = this.props.actions;
    /*
    const widgetRow = [{
      id: 1,
      display: 'stat',
      title: 'Budget goal',
      highlight: '-5%',
      info: ['12M lt less than 2014', 'Max 16% | Min 2%', 'Group: Pilot A', '12300 Consumers'],
      footer: 'Set: 1/3/2016',
    },
    {
      id: 2,
      display: 'stat',
      title: 'Savings',
      highlight: '-2%',
      info: ['6M lt less than 2014', 'Max 22% | Min -10%', 'Active for 4.6 months'],
      footer: 'Updated: 16/3/2016'
    },
    {
      id: 3,
      display: 'stat',
      title: 'Consumers',
      highlight: '-5%',
      info: ['300 Consumers changed to other budgets', 'Original: 10000', 'Current: 9700'],
      footer: 'Updated: 16/3/2016'
    }];

    const widgetRow2 = [{
      id: 1,
      display: 'stat',
      title: 'Budget goal',
      highlight: '-5%',
      info: ['12M lt less than 2014', 'Max 16% | Min 2%', 'Group: Pilot A', '12300 Consumers'],
      footer: 'Set: 1/3/2016',
    },
    {
      id: 2,
      display: 'stat',
      title: 'Savings',
      highlight: '-2%',
      info: ['6M lt less than 2014', 'Max 22% | Min -10%', 'Active for 4.6 months'],
      footer: 'Updated: 16/3/2016'
    },
    {
      id: 3,
      display: 'stat',
      title: 'Consumers',
      highlight: 'No change',
      info: [],
      footer: 'Updated: 16/3/2016'
    }];
    */
    //const { selectWizard, showErrorModal, validationError } = this.state;
    return (
      <div>
        <Table
          fields={activeBudgetsFields}
          data={activeBudgetsData} 
          template={{empty : (<span>{ 'No data found.' }</span>)}}
          style={activeBudgetsStyle}
        />
      </div>
    );
  }
})
/*;

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
     areas: [{
       value: 'kallithea',
       label: 'Kallithea',
       cluster: 'area',
     },
     {
       value: 'pangkrati',
       label: 'Pangkrati',
       cluster: 'area',
     },
     {
       value: 'lykavittos',
       label: 'Lykavittos',
       cluster: 'area',
     }],
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions : bindActionCreators(BudgetActions, dispatch)
  };
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  
  return {
    ...ownProps,
    ...dispatchProps,
    ...stateProps,
  };
}
function matches(str1, str2) {
  return str1.toLowerCase().indexOf(str2.toLowerCase()) != -1;
}

ActiveBudgets.icon = 'euro';
ActiveBudgets.title = 'Section.ActiveBudgets';
module.exports = connect(mapStateToProps, mapDispatchToProps, mergeProps)(ActiveBudgets);
*/
module.exports = ActiveBudgets;
