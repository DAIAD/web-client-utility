var React = require('react');
var { bindActionCreators } = require('redux');
var { connect } = require('react-redux');
var bs = require('react-bootstrap');
var { push } = require('react-router-redux');

var Actions = require('../../../actions/SavingsActions');
var { getTimeline } = require('../../../actions/MapActions');

var Table = require('../../../components/Table');
var util = require('../../../helpers/wizard');

var Breadcrumb = require('../../../components/Breadcrumb');


function SavingsPotential (props) {
  const { routes, children } = props;
  return (
    <div className='container-fluid' style={{ paddingTop: 10 }}>
      <div className='row'>
        <div className='col-md-12'>
          <Breadcrumb routes={routes}/>
        </div>
      </div>
      <div className='row'>
        <div className='col-md-12 col-sm-12' style={{marginTop: 10}}>
          <bs.Panel header='Savings scenarios'>
            {
              React.cloneElement(children, props)
            }
        </bs.Panel>
        </div>
      </div> 
    </div>
  );
}

function mapStateToProps(state) {
  return {
    routing: state.routing,
    user: state.session.profile ? {value: state.session.profile.username, label: state.session.profile.firstname + ' ' + state.session.profile.lastname} : null,
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
     scenarios: state.savings.scenarios.map(scenario => ({
       ...scenario, 
       paramsShort: util.getFriendlyParams(scenario.parameters, 'short')
        .map(x => `${x.key}: ${x.value}`).join(', '),
       paramsLong: util.getFriendlyParams(scenario.parameters, 'long')
       .map(x => `${x.key}: ${x.value}`).join(', ')
     })),

     removeScenario: state.savings.scenarios.find(s => s.id === state.savings.removeScenario),
     searchFilter: state.savings.searchFilter,
     validationError: state.savings.validationError,
     areas: state.map.map.areas,
     profile: state.session.profile,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions : {
      ...bindActionCreators({...Actions, getTimeline}, dispatch), 
      goToAddView: () => dispatch(push('/savings/add')),
      goToExploreView: (id) => dispatch(push(`/savings/${id}`)),
      goToListView: () => dispatch(push('/savings')),
      

    }
  };
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  const filteredScenarios = stateProps.searchFilter ? stateProps.scenarios.filter(s => matches(s.name, stateProps.searchFilter) || matches(s.user, stateProps.searchFilter)) : stateProps.scenarios;

  const tableData = {
    fields: [{
      name: 'id',
      title: 'Id',
      hidden: true
    }, 
    {
      name: 'name',
      title: 'Name',
      width: 120,
      link: function(row) {
        if(row.id) {
          return '/savings/{id}/';
        }
        return null;
      }
    }, 
    {
      name: 'potential',
      title: 'Potential',
    }, 
    {
      name: 'user',
      title: 'User',
    }, 
    {
      name: 'paramsShort',
      title: 'Parameters',
    //  width: 150
    },
    {
      name: 'createdOn',
      title: 'Created on',
      type: 'datetime',
      width: 100
    }, 
    {
      name: 'completedOn',
      title: 'Finished on',
      type: 'datetime',
      width: 100
    }, 
    {
      name: 'completed',
      title: 'Completed',
      type: 'action',
      icon: function(field, row) {
        return row.completedOn !=null ? 'check' : '';
      },
      handler: function(field, row) { return; }
    }, 
    {
      name : 'explore',
      title: 'Explore',
      type : 'action',
      icon : 'info-circle',
      handler : (function(field, row) {
        dispatchProps.actions.goToExploreView(row.id);
      }),
      visible : true
    }, 
    {
      name : 'delete',
      title: 'Delete',
      type : 'action',
      icon : 'remove',
      handler : (function(field, row) {
        dispatchProps.actions.confirmRemoveScenario(row.id);
      }),
      visible : true 
    }],
    rows: filteredScenarios || [],
    pager: {
      index: 0,
      size: 10,
      count: filteredScenarios.length || 0,
      mode: Table.PAGING_CLIENT_SIDE
    }    
  };
  
  const tableStyle = {
    row : {
      rowHeight: 70
    }
  }; 
    
  return {
    ...ownProps,
    ...dispatchProps,
    ...stateProps,
    tableData,
    tableStyle,
  };
}

function matches(str1, str2) {
  return str1.toLowerCase().indexOf(str2.toLowerCase()) != -1;
}

SavingsPotential.icon = 'percent';
SavingsPotential.title = 'Section.Savings';

module.exports = connect(mapStateToProps, mapDispatchToProps, mergeProps)(SavingsPotential);
