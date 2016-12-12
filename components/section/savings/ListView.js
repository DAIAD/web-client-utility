var React = require('react');
var bs = require('react-bootstrap');

var { savingsSchema } = require('../../../schemas/savings');

var Table = require('../../Table');


function SavingsPotentialList (props) {
  const { actions, removeScenario, searchFilter , scenarios, intl } = props;
  const { removeSavingsScenario, confirmRemoveScenario, setSearchFilter, goToAddView } = actions;

  const _t = x => intl.formatMessage({ id: x });

  const savingsScenarios = searchFilter ? scenarios.filter(s => matches(s.name, searchFilter) || matches(s.user, searchFilter)) : (Array.isArray(scenarios) ? scenarios : [])

  const tableSorter = {
    defaultSort: 'completedOn',
    defaultOrder: 'desc'
  };
  return (
    <bs.Panel header={<h3>{_t('Savings.List.title')}</h3>}>
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
          sortable
          data={savingsScenarios} 
          fields={savingsSchema(actions)}
          sorter={tableSorter}
          template={{empty : (<span>{ _t('Savings.List.empty') }</span>)}}
        />
        
    </bs.Panel>
  );
}

function matches(str1, str2) {
  return str1.toLowerCase().indexOf(str2.toLowerCase()) != -1;
}

module.exports = SavingsPotentialList;
