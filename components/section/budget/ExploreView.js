var React = require('react');
var { connect } = require('react-redux');
var bs = require('react-bootstrap');
var echarts = require('react-echarts');
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
  const { confirmSetBudget, confirmResetBudget, goToActiveView, setQueryCluster, setQueryGroup, setQuerySerial, setQueryText, resetQueryCluster, resetQueryGroup, requestExploreData, setQueryGeometry, resetQuery } = actions;
  const { cluster: selectedCluster, group: selectedGroup, geometry: selectedGeometry, serial: selectedSerial, text: selectedText, loading } = query;
  const { id, name, potential, user, createdOn, completedOn, activatedOn, parameters, paramsLong, params, active } = budget;
  const goal = parameters.goal;
  const completed = budget.completedOn != null;

  const _t = x => intl.formatMessage({ id: x });

  const dataNotFound = (
      <span>{ loading ? _t('Budgets.Explore.loading') : _t('Budgets.Explore.empty') }</span>
  );

  const activeCluster = clusters.find(cluster => cluster.key === selectedCluster);
  var clusterOptions = [{
    label: 'None',
    value: 'none'
  },
  ...clusters.map(cluster => ({ ...cluster, label: cluster.name, value: cluster.key }))
  ];
  
  var groupOptions = selectedCluster === 'none' ? [{
    label: 'Everyone',
    value: 'all'
  }] 
  : 
    [{
    label: 'All',
    value: 'all'
  },
  ...activeCluster.groups.map(group => ({ ...group, label: activeCluster.name + ': ' + group.name, value: group.key }))
  ];

  return (
    <div>
      <form onSubmit={e => { e.preventDefault(); requestExploreData(); }}>
      <bs.Row>
        <bs.Col md={1}>
          <label>Group:</label>
        </bs.Col>

        <bs.Col md={4}>
          <div className='form-group'>
          <Select className='select-cluster'
            value={selectedCluster}
            onChange={(val) => { 
              if (val == null) { 
                resetQueryCluster();
                resetQueryGroup();
              }
              else {  
                setQueryCluster(val.value); 
              }
            }}
            options={clusterOptions}
          />
        </div>

        <span className="help-block text-muted">Target a group (or cluster of groups) of consumers.</span>
        </bs.Col>

        <bs.Col md={4}>
          <div className='form-group'>
          <Select className='select-cluster-group'
            value={selectedGroup}
            onChange={(val) => { 
              if (val == null) { 
                resetQueryGroup();
              }
              else {
                setQueryGroup(val.value);
              }
            }}
            options={groupOptions}
           />
        </div>
        </bs.Col>
        <bs.Col md={3}>
          <bs.Button  style={{ marginRight: 20 }} bsStyle='primary' type="submit">Refresh</bs.Button>
          <bs.Button bsStyle='default' onClick={() => { resetQuery(); requestExploreData();}}>{_t('Budgets.Explore.resetForm')}</bs.Button>
        </bs.Col>
    </bs.Row>

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
            onChange={e => setQueryText(e.target.value)}
            value={selectedText || ''} 
          />
          <span className='help-block'>Filter by name or account</span>
        </bs.Col>
        
        <bs.Col md={4}>
          <bs.Input
            type='text'
            id='serialFilter' 
            name='serialFilter' 
            placeholder='SWM serial number ...'
            onChange={e => setQuerySerial(e.target.value)}
            value={selectedSerial || ''} 
          />
          <span className='help-block'>Filter meter serial number</span>
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
          data={selectedGeometry}
          onFeatureChange={features => { 
            setQueryGeometry(features && features.features && Array.isArray(features.features) && features.features.length > 0 ? features.features[0].geometry : null);
            requestExploreData();
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
        loading ? 
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
    if (!this.props.metersLocations || !this.props.metersLocations.features) {
      this.props.actions.getMetersLocations();
    }
    this.props.actions.requestExploreData();
  },
  componentWillUnmount: function() {
    this.props.actions.resetQuery();
  },
  render: function() {
    const { budget, budgets, groups, clusters, segments, areas, actions, budgetToSet, budgetToReset, metersLocations, exploreFields, exploreData, explorePager, exploreQuery, intl, details, stats } = this.props;
    const { goToListView, goToActiveView, confirmSetBudget, confirmResetBudget, setActiveBudget, resetActiveBudget, confirmRemoveBudgetScenario, resetQuery } = actions;
    
    const { id } = this.props.params;
    //TODO: here normally the budget will be fetched from API in componentWillMount
    //const budget = budgets.find(budget => budget.id === id);
    
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
    
    const { id:budgetId, name, potential, user, createdOn, completedOn, activatedOn, updatedOn, nextUpdateOn, parameters, params, active } = budget;
    const goal = parameters.goal;
    const completed = completedOn != null;

    return (
      <div>
        <bs.Panel header={<h3>{budget.name + _t('Budgets.Explore.overview')}</h3>}>
        <bs.Row>
          <bs.Col md={9} style={{ float: 'right' }}>
            <bs.Button 
              bsStyle='success' 
              style={{ float: 'right' }}
              onClick={() => { goToListView(); }}
              >
              <i className='fa fa-chevron-left' /> Back to all
            </bs.Button>
            { 
              !active ? 
                <bs.Button
                  bsStyle='danger'
                  style={{ float: 'right', marginRight: 25 }}
                  onClick={() => confirmRemoveBudgetScenario(budgetId)}
                  >
                  { _t('Budgets.Explore.delete') }
                </bs.Button>
                :
                <div />
            }
            {
              !active && completed ? 
                <bs.Button 
                  bsStyle='primary' 
                  style={{float: 'right', marginRight: 25}}
                  onClick={() => { confirmSetBudget(budgetId);  }}
                >
                { _t('Budgets.Explore.set') }
                </bs.Button>
                : <div />
            }
            {
                active && completed ?
                  <bs.Button 
                    bsStyle='warning' 
                    style={{float: 'right', marginRight: 25}}
                    onClick={() => { confirmResetBudget(budgetId); }}
                  >
                  { _t('Budgets.Explore.reset') }
                  </bs.Button>
                  :
                  <div />
            }
            {
              this.props.lala ? 
                  <bs.Button 
                    bsStyle='primary' 
                    style={{float: 'right', marginRight: 25}}
                    onClick={() => { goToActiveView(); }}
                  >
                    { _t('Budgets.Explore.monitorActive') }
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
              <bs.Col md={4} style={{ float: 'left', textAlign: 'left' }}>
                <h4>Budget is active</h4>
              </bs.Col>
              <bs.Col md={4} style={{ float: 'right', textAlign: 'right', marginBottom: 10 }}>
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
            
            <bs.Panel header={<h3>{budget.name + _t('Budgets.Explore.details')}</h3>}>
              <BudgetDetails
                clusters={clusters}
                groups={groups}
                budget={budget}
                query={exploreQuery}
                actions={actions}
                metersLocations={metersLocations}
                tableFields={exploreFields}
                data={exploreData}
                tablePager={explorePager}
                intl={intl}
              />
            </bs.Panel> 
          </div>
              : 
               <div />
        }
        {
          budgetToSet === budgetId ? 
            <Modal
              show
              className='confirmation-modal'
              title='Confirmation'
              text={<span>Are you sure you want to <i>set</i> <b>{name}</b> (id:{budgetId}) ?</span>}
              onClose={() => confirmSetBudget(null)}
              actions={[
                {
                  name: 'Cancel',
                  action: () => confirmSetBudget(null),
                },
                {
                  name: 'Set Budget',
                  style: 'primary',
                  action: () => { setActiveBudget(budgetId); confirmSetBudget(null); }
                },
              ]}
            />
            :
              <div />
      }
      {
        budgetToReset === budgetId ? 
          <Modal
            show
            className='confirmation-modal'
            title='Confirmation'
            text={<span>Are you sure you want to <i>deactivate</i> <b>{name}</b> (id:{budgetId}) ?</span>}
            onClose={() => confirmResetBudget(null)}
            actions={[
              {
                name: 'Cancel',
                action: () => confirmResetBudget(null),
              },
              {
                name: 'Deactivate budget',
                style: 'warning',
                action: () => { resetActiveBudget(budgetId); confirmResetBudget(null); }
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
    exploreQuery: state.budget.explore.query,
    exploreData: state.budget.explore.data,
  };
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  
  const exploreFields = exploreBudgetSchema(dispatchProps.actions); 

  const explorePager = {
    index: stateProps.exploreQuery.index || 0,
    size: stateProps.exploreQuery.size || 10,
    count: stateProps.exploreData.total || 0,
    onPageIndexChange: index => { ownProps.actions.setQueryIndex(index); ownProps.actions.requestExploreData(); },
    mode: Table.PAGING_SERVER_SIDE
  };

  const { metersLocations, viewportWidth, viewportHeight } = stateProps;
  const { budgets, clusters=[] } = ownProps;
  const budget = budgets.find(budget => budget.id === ownProps.params.id);
  const details = [], stats = [];
  
  if (budget) {
    const { activatedOn, createdOn, completedOn, params, paramsShort, user, updatedOn, expectation, actual, overlap, consumers } = budget;
    const completed = completedOn != null;
    const active = activatedOn != null;
    
    //const goal = parameters.goal;
    const lastYear = 2015;
    const activeFor = 5.5;

    if (completed) { 
      details.push({
          id: 1,
          display: 'stat', 
          title: 'Budget goal',
          highlight: `${expectation.savings}%`, 
          info: [{
            value: <span><b>{`${expectation.budget} M liters`}</b> {`${expectation.budget < 0 ? 'less' : 'more'} than ${lastYear}`}</span>
          },
          {
            value: <span><b>{`Max ${expectation.max}% | Min ${expectation.min}%`}</b></span>
          },
          {
            value: <span><b>{`${consumers} Consumers`}</b></span>
          }],
          footer: <span>{ activatedOn ? <span>Set: <FormattedDate value={activatedOn} day='numeric' month='numeric' year='numeric' /></span> : 'Inactive'}</span>,

      });

      if (active) {
        details.push({
          id: 20,
          display: 'stat',
          title: 'Savings',
          highlight: actual.savings ?  `${actual.savings}%` : '-',
          info: [{
            value: <span><b>{`${actual.budget || '-'} M liters`}</b> {`${actual.budget ? (actual.budget < 0 ? 'less' : 'more') : '-'} than ${lastYear}`}</span>
          },
          {
            value: <span><b>{`Max ${actual.max || '-'}% | Min ${actual.min || '-'}%`}</b></span>
          },
          {
            value: <span><b>{`Active for ${activeFor} months`}</b></span>
          }],
          footer: updatedOn ? <span>Updated: <FormattedDate value={updatedOn} day='numeric' month='numeric' year='numeric' /></span> : <span>Not estimated yet</span>,
         
        })

        if (overlap) {
          details.push({
            id: 21,
            display: 'stat',
            title: 'Consumers',
            highlight: `${overlap.savings}%`,
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
            footer: updatedOn ? <span>Updated: <FormattedDate value={updatedOn} day='numeric' month='numeric' year='numeric' /></span> : <span>Not estimated yet</span>,
          
          })
        }
        else {
          details.push({
            id: 21,
            display: 'stat',
            title: 'Consumers',
            highlight: 'No change',
            info: null,
            footer: updatedOn ? <span>Updated: <FormattedDate value={updatedOn} day='numeric' month='numeric' year='numeric' /></span> : <span>Not estimated yet</span>,
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
          title: cluster.name,
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
            data: cluster.groups.map(x => x.name)
          },
          grid: {
            x: Math.max(Math.max(...cluster.groups.map(group => group.name.length))*6.5, 45) + 'px',
          },
          series: [
            {
              name: cluster.name,
              color: (name, data, dataIndex) => theme.color.find((x, i, arr) => i  === dataIndex % arr.length),
              label: {
                formatter: y => y.toString() + '%',
              },
              fill: 0.8,
              data: cluster.groups.map(x => Math.round(Math.random()*10))
            }
          ]
        });
      });

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
          value: user
        },
        {
          key: 'Created on',
          value: createdOn ? <FormattedTime value={createdOn} minute='numeric' hour='numeric' day='numeric' month='numeric' year='numeric' /> : '-',
        },
        {
          key: 'Completed on',
          value: completedOn ? <FormattedTime value={completedOn} minute='numeric' hour='numeric' day='numeric' month='numeric' year='numeric' /> : '-',
        },
        {
          key: 'Activated on',
          value: activatedOn ? <FormattedTime value={activatedOn} minute='numeric' hour='numeric' day='numeric' month='numeric' year='numeric' /> : '-'
        }],
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

