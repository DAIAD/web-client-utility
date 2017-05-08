var React = require('react');
var { connect } = require('react-redux');
var bs = require('react-bootstrap');
var echarts = require('react-echarts');
var moment = require('moment');
var { FormattedTime, FormattedDate } = require('react-intl');

var Select = require('react-select');
var Table = require('../../Table');
var { Map, TileLayer, GeoJSON, DrawControl } = require('react-leaflet-wrapper');
var WidgetRow = require('../../WidgetRow');
var Modal = require('../../Modal');

var theme = require('../../chart/themes/blue-palette');
var { exploreBudgetSchema } = require('../../../schemas/budget');
var maximizable = require('../../Maximizable'); 


function BudgetDetails (props) {
  const { budget, clusters, groups, actions, metersLocations, tableFields, data, tablePager, tableStyle, query, intl } = props;
  const { confirmSetBudget, confirmResetBudget, goToActiveView, setQueryCluster, setQueryGroup, setQuerySerial, setQueryText, resetQueryCluster, resetQueryGroup, requestExploreData, setQueryGeometry, setExploreQuery, resetExploreQuery } = actions;
  const { key, name, potential, owner, createdOn, updatedOn, activatedOn, parameters, paramsLong, params, active } = budget;
  const goal = parameters.goal;
  const completed = budget.updatedOn != null;

  const _t = x => intl.formatMessage({ id: x });

  const dataNotFound = (
      <span>{ query.loading ? _t('Budgets.Explore.loading') : _t('Budgets.Explore.empty') }</span>
  );
  return (
    <div>
      <form onSubmit={e => { e.preventDefault(); requestExploreData(key); }}>
      <bs.Row>
        <bs.Col md={1}>
          <label>Search:</label>
        </bs.Col>
        <bs.Col md={4}>
          <bs.Input
            type='text'
            id='accountFilter' 
            name='accountFilter' 
            placeholder='Account or Name...'
            onChange={e => setExploreQuery({ text: e.target.value })}
            value={query.text} 
          />
          <span className='help-block'>Filter by name or account</span>
        </bs.Col>
        
        <bs.Col md={4}>
          <bs.Input
            type='text'
            id='serialFilter' 
            name='serialFilter' 
            placeholder='SWM serial number ...'
            onChange={e => setExploreQuery({ serial: e.target.value })}
            value={query.serial} 
          />
          <span className='help-block'>Filter meter serial number</span>
        </bs.Col>
        
        <bs.Col md={3}>
          <bs.Button  style={{ marginRight: 20 }} bsStyle='primary' type="submit">Refresh</bs.Button>
          <bs.Button bsStyle='default' onClick={() => { resetExploreQuery(); requestExploreData(key);}}>{_t('Budgets.Explore.resetForm')}</bs.Button>
        </bs.Col>

      </bs.Row>
     
    <br />
    <Map
      width='100%'
      height={300}
      center={[38.35, -0.48]}
      zoom={13}
      >
      <TileLayer />
        <DrawControl
          controlled
          data={query.geometry}
          onFeatureChange={features => { 
            setExploreQuery({ geometry: features && features.features && Array.isArray(features.features) && features.features.length > 0 ? features.features[0].geometry : null });
            requestExploreData(key);
          }}
        />
    
        <GeoJSON
          name='Users'
          data={data.features}
          popupContent={feature => <div><h4>{feature.properties.name}</h4><h5>Address: <span>{feature.properties.address}</span></h5><h5>Meter id: {feature.properties.meter.serial}</h5><h5>Savings: {feature.properties.savings}%</h5><h5>Budget: {feature.properties.budget} lt</h5></div>}
        />
    </Map>

    <br />
    <Table  
      fields={tableFields}
      data={data.accounts}
      pager={tablePager} 
      template={{empty : dataNotFound}}
      style={{
        table: tableStyle,
      }} 
    />
    {
      query.loading ? 
        <div>
          <img className='preloader' src='/assets/images/utility/preloader-counterclock.png' />
          <img className='preloader-inner' src='/assets/images/utility/preloader-clockwise.png' />
        </div>
        :
          <div />
      }
      <br />

    </form>
  </div> 
  );
}

var BudgetExplore = React.createClass({ 
  componentWillMount: function() {
    if (this.props.clusters) {
      this.props.actions.requestExploreData(this.props.params.id);
    }
  },
  componentWillReceiveProps: function (nextProps) {
    if (nextProps.clusters && !this.props.clusters) {
      this.props.actions.requestExploreData(this.props.params.id);
    }
  },
  componentWillUnmount: function() {
    this.props.actions.resetExploreQuery();
  },
  render: function() {
    const { budgets, groups, exploreClusters: clusters, segments, areas, actions, budgetToSet, budgetToReset, metersLocations, exploreFields, exploreUsers, explorePager, exploreQuery, intl, details, stats } = this.props;
    const { goToListView, goToActiveView, confirmSetBudget, confirmResetBudget, setActiveBudget, resetActiveBudget, confirmRemoveBudgetScenario, setExploreQuery, resetExploreQuery, scheduleBudget } = actions;
    
    const { id } = this.props.params;
    const budget = budgets.find(budget => budget.key === id);
    
    const _t = x => intl.formatMessage({ id: x });
    if (!clusters) return null;
    if (budget == null) {
      return (
        <bs.Panel header='404'>
          <bs.Row>
            <bs.Col md={6}>
              <h4>{_t('Budgets.Explore.notFound')}</h4>
            </bs.Col> 
            <bs.Col md={6} style={{textAlign: 'right'}}>
              <bs.Button bsStyle='success' onClick={() => { goToListView(); }}><i className='fa fa-chevron-left'></i> Back to all</bs.Button>
            </bs.Col>
          </bs.Row> 
        </bs.Panel>
      );
    } 
    
    const { key:budgetKey, name, potential, owner, createdOn, activatedOn, updatedOn, nextUpdateOn, parameters, params, active, initialized } = budget;
    const goal = parameters.goal;
    const completed = initialized;
    return (
      <div>
        <bs.Panel header={<h3>{name + _t('Budgets.Explore.overview')}</h3>}>
        <bs.Row>
          <bs.Col md={1}>
            { completed ? 
              <bs.Button
                onClick={() => { scheduleBudget(budgetKey) }}
              >
                { _t('Budgets.List.refresh') }
              </bs.Button>
              :
              <span />
            }
          </bs.Col>

          <bs.Col md={9} style={{ float: 'right' }}>
            <bs.Button 
              bsStyle='success' 
              style={{ float: 'right' }}
              onClick={() => { goToListView(); }}
              >
              <i className='fa fa-chevron-left' /> Back to all
            </bs.Button>
            { 
              active !== false ? 
                <bs.Button
                  bsStyle='danger'
                  style={{ float: 'right', marginRight: 25 }}
                  onClick={() => confirmRemoveBudgetScenario(budgetKey)}
                  >
                  { _t('Budgets.Explore.delete') }
                </bs.Button>
                :
                <div />
            }
            {
              !active ? 
                <bs.Button 
                  bsStyle='primary' 
                  style={{float: 'right', marginRight: 25}}
                  onClick={() => { confirmSetBudget(budgetKey);  }}
                >
                { _t('Budgets.Explore.set') }
                </bs.Button>
                : <div />
            }
            {
                active ?
                  <bs.Button 
                    bsStyle='warning' 
                    style={{float: 'right', marginRight: 25}}
                    onClick={() => { confirmResetBudget(budgetKey); }}
                  >
                  { _t('Budgets.Explore.reset') }
                  </bs.Button>
                  :
                  <div />
            }
            </bs.Col>
          </bs.Row>
          <hr/>
          { 
          active ? 
            <bs.Row>
              <bs.Col md={2} style={{ float: 'left', textAlign: 'left' }}>
                <h4>Budget is active</h4>
              </bs.Col>
              <bs.Col md={3} style={{ float: 'right', textAlign: 'right', marginBottom: 10 }}>
                <h5>Updated: {updatedOn ? <FormattedTime value={updatedOn} minute='numeric' hour='numeric' day='numeric' month='numeric' year='numeric' /> : '-'}</h5>
                <h5>Next update: {nextUpdateOn ? <FormattedTime value={nextUpdateOn} minute='numeric' hour='numeric' day='numeric' month='numeric' year='numeric' /> : '-'}</h5>
              </bs.Col>
            </bs.Row>
          :
            <div />
          }

        <WidgetRow
          itemsPerRow={3}
          widgets={details}
        />
         
        </bs.Panel>
        
      { 
        completed ? 
          <div>
            <bs.Panel header={<h3>{_t('Budgets.Explore.stats')}</h3>}>
              <WidgetRow
                itemsPerRow={2}
                widgets={stats}
              />
            </bs.Panel>
            
            <bs.Panel header={<h3>{name + _t('Budgets.Explore.details')}</h3>}>
              <BudgetDetails
                clusters={clusters}
                groups={groups}
                budget={budget}
                query={exploreQuery}
                actions={actions}
                metersLocations={metersLocations}
                tableFields={exploreFields}
                data={exploreUsers}
                tablePager={explorePager}
                intl={intl}
              />
            </bs.Panel> 
          </div>
              : 
               <div />
        }
        {
          budgetToSet === budgetKey ? 
            <Modal
              show
              className='confirmation-modal'
              title='Confirmation'
              text={<span>Are you sure you want to <i>set</i> <b>{name}</b> ({budgetKey}) ?</span>}
              onClose={() => confirmSetBudget(null)}
              actions={[
                {
                  name: 'Cancel',
                  action: () => confirmSetBudget(null),
                },
                {
                  name: 'Set Budget',
                  style: 'primary',
                  action: () => { setActiveBudget(budgetKey); confirmSetBudget(null); }
                },
              ]}
            />
            :
              <div />
      }
      {
        budgetToReset === budgetKey ? 
          <Modal
            show
            className='confirmation-modal'
            title='Confirmation'
            text={<span>Are you sure you want to <i>deactivate</i> <b>{name}</b> ({budgetKey}) ?</span>}
            onClose={() => confirmResetBudget(null)}
            actions={[
              {
                name: 'Cancel',
                action: () => confirmResetBudget(null),
              },
              {
                name: 'Deactivate budget',
                style: 'warning',
                action: () => { resetActiveBudget(budgetKey); confirmResetBudget(null); }
              },
            ]}
          />
          :
            <div />
      }
         
      </div>

    );
  }
});

function mapStateToProps(state) {
  return {
    viewportWidth: state.viewport.width,
    viewportHeight: state.viewport.height,
    budgetToSet: state.budget.budgetToSet,
    budgetToReset: state.budget.budgetToReset,
    metersLocations: state.map.metersLocations,
    clusters: state.config.utility.clusters,
    exploreQuery: state.budget.explore.query,
    exploreUsers: state.budget.explore.users,
    exploreBudget: state.budget.explore.budget,
    exploreClusters: state.budget.explore.clusters,
  };
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  
  const exploreFields = exploreBudgetSchema(dispatchProps.actions); 

  const explorePager = {
    index: stateProps.exploreQuery.index || 0,
    size: stateProps.exploreQuery.size || 10,
    count: stateProps.exploreUsers.total || 0,
    onPageIndexChange: index => { ownProps.actions.setExploreQuery({ index }); ownProps.actions.requestExploreData(ownProps.params.id); },
    mode: Table.PAGING_SERVER_SIDE
  };

  const { metersLocations, viewportWidth, viewportHeight, exploreClusters: clusters } = stateProps;
  const { budgets } = ownProps;
  const budget = budgets.find(budget => budget.key === ownProps.params.id);
  const details = [], stats = [];
  
  if (budget) {
    const { activatedOn, initialized, numberOfConsumers, createdOn, updatedOn, params, paramsShort, owner, expectation = {}, actual = {}, overlap = null, consumptionBefore, consumptionAfter } = budget;
    const expectedPercent = Math.round(budget.expectedPercent * 100) / 100;
    const savingsPercent = Math.round(budget.savingsPercent * 100) / 100;
    const completed = initialized;
    const active = activatedOn != null;
    
    const activeHours = Math.round(moment().diff(activatedOn, 'hours', true) * 10) / 10;
    const activeDays = Math.floor(moment().diff(activatedOn, 'days', true));
    const activeMonths = Math.floor(moment().diff(activatedOn, 'months', true));
    const activeFor = (() => {
      if (activeMonths > 0) return `${activeMonths} months`;
      else if (activeDays > 0) return `${activeDays} days`;
      return `${activeHours} hours`;
    })();

    if (completed) { 
      details.push({
          id: 1,
          display: 'stat', 
          title: 'Budget goal',
          highlight: `${expectedPercent * 100}%`, 
          info: [
          //{
          //  value: <span><b>{`Max ${expectation.max}% | Min ${expectation.min}%`}</b></span>
          //},
          {
            value: <span><b>{`${numberOfConsumers} Consumers`}</b></span>
          }],
          footer: <span>{ activatedOn ? <span>Set: <FormattedTime value={activatedOn} day='numeric' month='numeric' year='numeric' hour='numeric' minute='numeric' /></span> : 'Inactive'}</span>,

      });

      if (active) {
        details.push({
          id: 20,
          display: 'stat',
          title: 'Savings',
          highlight: savingsPercent ?  `${savingsPercent * 100}%` : '-',
          info: [
          {
            value: <span><b>{`${consumptionBefore} lt`}</b> before</span>
          },
          {
            value: <span><b>{`${consumptionAfter} lt`}</b> after</span>
          },
          {
            value: <span><b>{`Active for ${activeFor}`}</b></span>
          }],
          footer: updatedOn ? <span>Updated: <FormattedTime value={updatedOn} day='numeric' month='numeric' year='numeric' hour='numeric' minute='numeric' /></span> : <span>Not estimated yet</span>,
         
        })

        if (overlap) {
          details.push({
            id: 21,
            display: 'stat',
            title: 'Consumers',
            highlight: overlap && overlap.savings && `${overlap.savings}%` || '-',
            info: [{
              value: <span><b>{`${overlap.original - overlap.current} consumers changed to other budgets`}</b></span>
            },
            {
              value: <b>Original: {overlap.original}</b>
            },
            {
              value: <b>Current: {overlap.current}</b>,
            },
            ],
          footer: updatedOn ? <span>Updated: <FormattedTime value={updatedOn} day='numeric' month='numeric' year='numeric' hour='numeric' minute='numeric' /></span> : <span>Not estimated yet</span>,
          
          })
        }
        else {
          details.push({
            id: 21,
            display: 'stat',
            title: 'Consumers',
            highlight: 'No change',
            info: null,
            footer: null,
            style: {
              color: '#666',
              textAlign: 'center',
              paddingTop: 20
            }
            })

          //overlap
        }
        //active
      }

      clusters.forEach((cluster, i) => {
        stats.push({
          id: i,
          title: cluster.clusterName,
          display: 'chart',
          maximizable: true,
          viewportWidth,
          viewportHeight,
          style: {
            height: 200
          },
          theme,
          yAxis: {
            formatter: y => y.toString() + '%',
          },
          xAxis: {
            data: cluster.segments.map(x => x.name)
          },
          grid: {
            x: Math.max(Math.max(...cluster.segments.map(group => group.name.length))*6.5, 45) + 'px',
          },
          series: [
            {
              name: cluster.clusterName,
              color: (name, data, dataIndex) => theme.color.find((x, i, arr) => i  === dataIndex % arr.length),
              label: {
                formatter: y => y.toString() + '%',
              },
              fill: 0.8,
              data: cluster.segments.map(x => Math.round(x.percent))
            }
          ]
        });
      });


      /*
        stats.push({
          id: 100,
          title: 'Map',
          display: 'map',
          maximizable: true,
          style: {
            height: 200,
          },
          map: {},
          data: metersLocations && metersLocations.features ? 
            metersLocations.features.map(feature => [feature.geometry.coordinates[1], feature.geometry.coordinates[0], Math.abs(Math.random()-0.8)]) : []
        });
        
        */
        //completed
        }

    //all
    details.push({
        id: 2,
        display: 'stat',
        title: 'Details',
        style: {
          width: 250,
          height: 100
        },
        highlight: null,
        info: [{
          key: 'Created by',
          value: owner,
        },
        {
          key: 'Created on',
          value: createdOn ? <FormattedTime value={createdOn} minute='numeric' hour='numeric' day='numeric' month='numeric' year='numeric' /> : '-',
        },
        {
          key: 'Activated on',
          value: activatedOn ? <FormattedTime value={activatedOn} minute='numeric' hour='numeric' day='numeric' month='numeric' year='numeric' /> : '-'
        },
        {
          key: 'Updated on',
          value: updatedOn ? <FormattedTime value={updatedOn} minute='numeric' hour='numeric' day='numeric' month='numeric' year='numeric' /> : '-',
        },
        ],
        footer: <span>&nbsp;</span>,
    });

    //all
   details.push({
        id: 3,
        display: 'stat',
        title: 'Parameters',
        maximizable: true,
        dialogClassName: 'maximized-modal-half',
        highlight: null,
        style: {
          width: 250,
        },
        info: paramsShort,
        maximizedProps: {
          info: params
        },
        maximizedStyle: {
          width: '80%',
          height: '10vh',
          fontSize: '1.5em'
        },
        footer: <span>&nbsp;</span>,
        limit: 5,
        show: 3
   });

  }

  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    budget,
    details,
    stats,
    exploreFields,
    explorePager
  };
}
module.exports = connect(mapStateToProps, null, mergeProps)(BudgetExplore);

