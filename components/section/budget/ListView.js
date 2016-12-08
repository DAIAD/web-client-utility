var React = require('react');
var bs = require('react-bootstrap');
var Table = require('../../Table');
var { budgetSchema } = require('../../../schemas/budget'); 

function BudgetsList (props) {
  const { groups, clusters, segments, areas, budgets, actions, budgetToRemove, searchFilter } = props;
  const { removeBudgetScenario, confirmRemoveBudgetScenario, setSearchFilter, goToAddView } = actions;
  const budgetFields = budgetSchema(actions);
  const budgetSorter = {
    defaultSort: 'completedOn',
    defaultOrder: 'desc'
  };
  const budgetData  = searchFilter ? budgets.filter(s => matches(s.name, searchFilter) || matches(s.user, searchFilter)) : ( Array.isArray(budgets) ? budgets : []);

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
        
      
    </bs.Panel>
  );
}

function matches(str1, str2) {
  return str1.toLowerCase().indexOf(str2.toLowerCase()) != -1;
}

module.exports = BudgetsList;
