var React = require('react');
var bs = require('react-bootstrap');

var Modal = require('../../Modal');
var Table = require('../../Table');

function RemoveConfirmation (props) {
  const { scenario, confirmRemoveScenario, removeScenario } = props;
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
          action: () => { removeScenario(id); confirmRemoveScenario(null); },
          style: 'danger',
        },
      ]}
    />
  );
}

function BudgetsList (props) {
  const { groups, clusters, segments, areas, budgetFields, budgetData, budgetSorter, actions, budgetToRemove, searchFilter } = props;
  const { removeBudgetScenario, confirmRemoveBudgetScenario, setSearchFilter, goToAddView } = actions;
  return (
    <bs.Panel header='Budgets'>
      <bs.Row>
        <bs.Col sm={4} md={5}>
          <bs.Input 
            style={{width: '80%', float: 'left'}}
            type='text'
            placeholder='Search...'
            onChange={(e) => setSearchFilter(e.target.value)}
            value={searchFilter}
          />
       </bs.Col>
        <bs.Col sm={8} md={7} style={{textAlign: 'right'}}>
         <bs.Button 
           bsStyle='success' 
           onClick={() => { goToAddView(); }}
           ><i className='fa fa-plus'></i> Add New
         </bs.Button>
       </bs.Col>
     </bs.Row>
        <hr/>
        <Table  
          sortable
          fields={budgetFields}
          sorter={budgetSorter}
          data={budgetData} 
          template={{empty : (<span>{ 'No data found.' }</span>)}}
        />
        
      <RemoveConfirmation
        scenario={budgetToRemove}
        removeScenario={removeBudgetScenario}
        confirmRemoveScenario={confirmRemoveBudgetScenario}
      />
    </bs.Panel>
  );
}

module.exports = BudgetsList;
