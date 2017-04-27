var React = require('react');
var { bindActionCreators } = require('redux');
var { connect } = require('react-redux');
var bs = require('react-bootstrap');
var Modal = require('../../Modal');

var { push } = require('react-router-redux');

var Actions = require('../../../actions/SavingsActions');
var { getTimeline, getMetersLocations } = require('../../../actions/MapActions');

var Table = require('../../../components/Table');
var util = require('../../../helpers/wizard');

const SPATIAL_CLUSTERS = [{
  key: 'area',
  name: 'Areas'
}];

function SavingsPotential (props) {
  const { routes, children } = props;
  return (
    <div className='container-fluid' style={{ paddingTop: 10 }}>
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
  const filteredScenarios = stateProps.searchFilter ? stateProps.scenarios.filter(s => matches(s.name, stateProps.searchFilter) || matches(s.user, stateProps.searchFilter)) : stateProps.scenarios;

  const tableFields = [{
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
    }];

    const tableData = filteredScenarios || [];


    const tableSorter = {
      defaultSort: 'completedOn',
      defaultOrder: 'desc'
    };

  return {
    ...ownProps,
    ...dispatchProps,
    ...stateProps,
    tableData,
    tableFields,
    tableSorter,
  };
}

function matches(str1, str2) {
  return str1.toLowerCase().indexOf(str2.toLowerCase()) != -1;
}

SavingsPotential.icon = 'percent';
SavingsPotential.title = 'Section.Savings';

module.exports = connect(mapStateToProps, mapDispatchToProps, mergeProps)(SavingsPotential);
