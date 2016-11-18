var React = require('react');
var bs = require('react-bootstrap');

var Modal = require('../../Modal');
var Table = require('../../Table');

function RemoveConfirmation (props) {
  const { scenario, confirmRemoveScenario, removeSavingsScenario } = props;
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
          action: () => { removeSavingsScenario(id); confirmRemoveScenario(null); },
          style: 'danger',
        },
      ]}
    />
  );
}

function SavingsPotentialList (props) {
  const { tableData, tableFields, tableStyle, actions, removeScenario, searchFilter } = props;
  const { removeSavingsScenario, confirmRemoveScenario, setSearchFilter, goToAddView } = actions;
  return (
    <bs.Panel header='Scenarios'>
      <bs.Row>
        <bs.Col sm={4} md={5}>
        <bs.Input 
          type='text'
          placeholder='Search...'
          onChange={(e) => setSearchFilter(e.target.value)}
          value={searchFilter}
         />
       </bs.Col>
        <bs.Col sm={5} md={7} style={{textAlign: 'right'}}>
         <bs.Button 
           bsStyle='success' 
           onClick={() => { goToAddView(); }}
           ><i className='fa fa-plus'></i> Add New
         </bs.Button>
       </bs.Col>
     </bs.Row>
        <hr/>
        <Table  
          data={tableData} 
          fields={tableFields}
          template={{empty : (<span>{ 'No data found.' }</span>)}}
          style={tableStyle}
        />
        
      <RemoveConfirmation
        scenario={removeScenario}
        removeSavingsScenario={removeSavingsScenario}
        confirmRemoveScenario={confirmRemoveScenario}
      />
    </bs.Panel>
  );
}

module.exports = SavingsPotentialList;
