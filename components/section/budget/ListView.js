var React = require('react');
var bs = require('react-bootstrap');
var Table = require('../../Table');
var { budgetSchema } = require('../../../schemas/budget');

function BudgetsList(props) {
  const { actions, query, intl } = props;
  const { name } = query;
  const { setQueryAndFetch, goToAddView, goToActiveView } = actions;
  const budgetFields = budgetSchema(actions);
  const budgetSorter = {
    defaultSort: 'createdOn',
    defaultOrder: 'desc'
  };
  const budgets = props.budgets
    .map(scenario => ({
      ...scenario,
      paramsShort: scenario.paramsShort
        .map(x => (
          <span>
            <span style={{ whiteSpace: 'nowrap' }}>{x.key}</span>
        (<b style={{ whiteSpace: 'nowrap' }}>{x.value}</b>)
        &nbsp;
          </span>
        )),
    }));

  const _t = x => intl.formatMessage({ id: x });

  return (
    <bs.Panel header={<h3>{_t('Budgets.List.title')}</h3>}>
      <bs.Row>
        <bs.Col sm={4} md={5}>
          <bs.Input
            style={{ width: '80%', float: 'left' }}
            type='text'
            placeholder={_t('Budgets.List.search')}
            onChange={(e) => setQueryAndFetch({ name: e.target.value })}
            value={name}
          />
        </bs.Col>
        <bs.Col sm={8} md={7} style={{ textAlign: 'right' }}>
          {props.hide ?
            <bs.Button
              bsStyle='primary'
              style={{ marginRight: 20 }}
              onClick={() => { goToActiveView(); }}
            ><i className='fa fa-eye'></i> Monitor active
         </bs.Button>
            : <span />
          }
          <bs.Button
            bsStyle='success'
            onClick={() => { goToAddView(); }}
          ><i className='fa fa-plus'></i> Add New
         </bs.Button>
        </bs.Col>
      </bs.Row>
      <hr />
      <Table
        sortable
        fields={budgetFields}
        sorter={budgetSorter}
        data={budgets}
        template={{ empty: (<span>{_t('Budgets.List.empty')}</span>) }}
      />
    </bs.Panel>
  );
}

module.exports = BudgetsList;
