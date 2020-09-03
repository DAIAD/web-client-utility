var React = require('react');
var bs = require('react-bootstrap');
const _ = require('lodash');

var { savingsSchema } = require('../../../schemas/savings');

var Table = require('../../Table');

const PAGING_SERVER_SIDE = 'server';

function sortIdToSortBy(id) {
  switch (id) {
    case 'name':
      return 'NAME';
    case 'status':
      return 'STATUS';
    case 'createdOn':
      return 'CREATED_ON';
    default:
      return '';
  }
}

function SavingsPotentialList(props) {
  const { actions, query, intl } = props;
  const { goToAddView } = actions;

  const { name: searchFilter } = query;
  const _t = x => intl.formatMessage({ id: x });

  const scenarios = props.scenarios
    .map(scenario => ({
      ...scenario,
      potential: scenario.potential,
      paramsShort: scenario.paramsShort
        .map(x => (
          <span>
            <span style={{ whiteSpace: 'nowrap' }}>{x.key}</span>
        (<b style={{ whiteSpace: 'nowrap' }}>{x.value}</b>)
        &nbsp;
          </span>
        )),
    }));

  const tableSorter = {
    defaultSort: 'createdOn',
    defaultOrder: 'desc',
    onSortChange: (sortId, sortOrder) => {
      props.actions.setQueryAndFetch({
        sortBy: sortIdToSortBy(sortId),
        sortAscending: sortOrder === 'asc',
      });
    },
  };
  return (
    <bs.Panel header={<h3>{_t('Savings.List.title')}</h3>}>
      <bs.Row>
        <bs.Col sm={4} md={5}>
          <bs.Input
            type='text'
            placeholder='Search...'
            onChange={(e) => {
              props.actions.setQuery({ name: e.target.value });
              _.debounce(() => {
                props.actions.setQueryAndFetch({ pageIndex: 0 });
              }, 300)();
            }}
            value={searchFilter}
          />
        </bs.Col>
        <bs.Col sm={5} md={7} style={{ textAlign: 'right' }}>
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
        data={scenarios}
        fields={savingsSchema(actions)}
        pager={{
          count: query.total,
          index: query.pageIndex,
          size: query.pageSize,
          onPageIndexChange: index => props.actions.setQueryAndFetch({ pageIndex: index }),
          mode: PAGING_SERVER_SIDE,
        }}
        sorter={tableSorter}
        style={{ header: { whiteSpace: 'nowrap' } }}
        template={{ empty: (<span>{_t('Savings.List.empty')}</span>) }}
      />
    </bs.Panel>
  );
}

module.exports = SavingsPotentialList;
