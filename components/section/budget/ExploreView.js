var React = require('react');
var bs = require('react-bootstrap');
var echarts = require('react-echarts');
var { FormattedTime, FormattedDate } = require('react-intl');

var Select = require('react-select');
var Table = require('../../Table');
var { Map, TileLayer, GeoJSON, DrawControl } = require('react-leaflet-wrapper');
var Widget = require('../../WidgetComponent');
var Modal = require('../../Modal');
var theme = require('../../chart/themes/blue');

function BudgetOverview (props) {
  const { budget, clusters, groups, actions, metersLocations, tableFields, data, tablePager, tableStyle, query } = props;
  const { confirmSetBudget, confirmResetBudget, goToActiveView, setQueryCluster, setQueryGroup, setQuerySerial, setQueryText, resetQueryCluster, resetQueryGroup, requestExploreData, setQueryGeometry } = actions;
  const { cluster: selectedCluster, group: selectedGroup, geometry: selectedGeometry, serial: selectedSerial, text: selectedText, loading } = query;
  const { id, name, potential, user, createdOn, completedOn, activatedOn, parameters, paramsLong, params, active } = budget;
  const goal = parameters.goal;
  const completed = budget.completedOn != null;

  const widgets = [
    
    {
      id: 1,
      display: 'stat', 
      title: 'Budget goal',
      highlight: goal ? goal.label : null, 
      style: {
        width: 300,
      },
      info: ['12M lt less than 2014', 'Max 16% | Min 2%', 'Group: Pilot A', '12301 Consumers'],
      footer: <span>{ activatedOn ? <span>Set: <FormattedDate value={activatedOn} day='numeric' month='numeric' year='numeric' /></span> : 'Inactive'}</span>,
    }, 
    {
    id: 2,
    display: 'stat',
    title: 'Details',
    style: {
      width: 300,
    },
    highlight: goal && goal.values ? goal.values.label : null,
    info: [
      <span><b>Created by:</b> { user } </span>,
      <span><b>Created on:</b> { createdOn ? <FormattedTime value={createdOn} minute='numeric' hour='numeric' day='numeric' month='numeric' year='numeric' /> : '-'}</span>,
      <span><b>Completed on:</b> { completedOn ? <FormattedTime value={completedOn} minute='numeric' hour='numeric' day='numeric' month='numeric' year='numeric' /> : '-'}</span>,
      <span><b>Activated on:</b> { activatedOn ? <FormattedTime value={activatedOn} minute='numeric' hour='numeric' day='numeric' month='numeric' year='numeric' /> : '-'}</span>,
    ],
    footer: <span>&nbsp;</span>,
    },
    
  {
    id: 3,
    display: 'stat',
    title: 'Parameters',
    highlight: null,
    style: {
      width: 300,
    },
    info: params.map(p =>
      <span><b>{p.key}:</b> {p.value}</span>
    ),
    footer: <span>&nbsp;</span>,
  }
  ];

  if (completed) {
    clusters.forEach((cluster, i) => {

      widgets.push({
        id: i + 4,
        display: 'chart',
        style: {
          height: 200,
          width: 300
        },
        yAxis: {
          formatter: y => y.toString() + '%',
        },
        xAxis: {
          name: cluster.label,
          data: groups.filter(g => g.cluster === cluster.value).map(x => x.label)
        },
        series: [
          {
            name: '',
            type: 'bar',
            fill: 0.8,
            data: groups.filter(g => g.cluster === cluster.value).map(x => Math.round(Math.random()*50))
          }
        ]
      });


    });

      widgets.push({
        id: 25,
        display: 'map',
        style: {
          height: 200,
          width: 300,
        },
        map: {},
        data: metersLocations && metersLocations.features ? 
          metersLocations.features.map(feature => [feature.geometry.coordinates[1], feature.geometry.coordinates[0], Math.abs(Math.random()-0.8)]) : []
      });

  }
    
    const dataNotFound = (
        <span>{ loading ? 'Loading data ...' : 'No data found.' }</span>
    );

    //const clusterKey = 'none', groupKey = 'all';

    var clusterOptions = [{
      label: 'None',
      value: 'none'
    },
    ...clusters
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
    ...groups.filter(group => group.cluster === selectedCluster)
    ];

  return (
    <bs.Row style={{ marginLeft: 10 }}>
    {
      widgets.map((widget, i) => 
          <div key={widget.id} style={{float: 'left', margin: 10}}>
            <Widget {...widget} />
          </div>
      )
    }
    </bs.Row>
  );
}

function BudgetDetails (props) {
  const { budget, clusters, groups, actions, metersLocations, tableFields, data, tablePager, tableStyle, query } = props;
  const { confirmSetBudget, confirmResetBudget, goToActiveView, setQueryCluster, setQueryGroup, setQuerySerial, setQueryText, resetQueryCluster, resetQueryGroup, requestExploreData, setQueryGeometry, resetQuery } = actions;
  const { cluster: selectedCluster, group: selectedGroup, geometry: selectedGeometry, serial: selectedSerial, text: selectedText, loading } = query;
  const { id, name, potential, user, createdOn, completedOn, activatedOn, parameters, paramsLong, params, active } = budget;
  const goal = parameters.goal;
  const completed = budget.completedOn != null;

  const dataNotFound = (
      <span>{ loading ? 'Loading data ...' : 'No data found.' }</span>
  );

  var clusterOptions = [{
    label: 'None',
    value: 'none'
  },
  ...clusters
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
  ...groups.filter(group => group.cluster === selectedCluster)
  ];

  return (
    <div>
      <bs.Row>
        <bs.Col md={2}>
          <label>Group:</label>
        </bs.Col>
        <bs.Col md={10}>
        <div style={{ display: 'inline-block', width: '40%' }}>
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
              //requestExploreData();
            }}
            options={clusterOptions}
          />
        </div>
          &nbsp;&nbsp;

        <div style={{ display: 'inline-block', width: '40%' }}>
          <Select className='select-cluster-group'
            value={selectedGroup}
            onChange={(val) => { 
              if (val == null) { 
                resetQueryGroup();
              }
              else {
                setQueryGroup(val.value);
              }
              //requestExploreData();
            }}
            options={groupOptions}
           />
        </div>
        <div style={{ display: 'inline-block', width: '10%' }}>
          <bs.Button style={{ float: 'right' }} bsStyle='default' onClick={() => { resetQuery(); requestExploreData();}}>Reset</bs.Button>
        </div>
          <p className="help text-muted">Target a group (or cluster of groups) of consumers.</p>
      </bs.Col>
    </bs.Row>

    <form onSubmit={e => { e.preventDefault(); requestExploreData(); }}>
      <bs.Row>
        <bs.Col md={2}>
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
        <bs.Col md={2}>
          <bs.Button bsStyle='primary' type="submit">Refresh</bs.Button>
        </bs.Col>
      </bs.Row>
     
    </form>

    <br />
    <Map
      style={{ width: '100%', height: 300}}
      center={[38.35, -0.48]}
      zoom={13}
      >
      <TileLayer />
        <DrawControl
          data={selectedGeometry}
          onFeatureChange={features => { 
            setQueryGeometry(features && features.features && Array.isArray(features.features) && features.features.length > 0 ? features.features[0].geometry : null);
            requestExploreData();
          }}
        />
    
        <GeoJSON
          name='Users'
          data={data.features}
          popupContent={feature => <div><h4>{feature.properties.name}</h4><h5>Address: <span>{feature.properties.address}</span></h5><h5>Meter id: {feature.properties.meter.serial}</h5><h5>Savings: {feature.properties.savings}</h5></div>}
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
  </div> 
  );
}

var BudgetExplore = React.createClass({ 
  componentWillMount: function() {
    if (!this.props.metersLocations) {
      this.props.actions.getMetersLocations();
    }
    this.props.actions.requestExploreData();
  },
  render: function() {
    const { budgets, groups, clusters, segments, areas, actions, params, budgetToSet, budgetToReset, metersLocations, exploreFields, exploreData, explorePager, exploreQuery } = this.props;
    const { goToListView, goToActiveView, confirmSetBudget, confirmResetBudget, setActiveBudget, resetActiveBudget } = actions;
    const { id } = params;
    const budget = budgets.find(budget => budget.id === id);
    if (budget == null) {
      return (
        <bs.Panel header='Oops'>
          <bs.Row>
            <bs.Col md={6}>
              <h4>Sorry, budget not found.</h4>
            </bs.Col> 
            <bs.Col md={6} style={{textAlign: 'right'}}>
              <bs.Button bsStyle='success' onClick={() => { goToListView(); }}><i className='fa fa-chevron-left'></i> Back to all</bs.Button>
            </bs.Col>
          </bs.Row> 
        </bs.Panel>
      );
    } 
    
    const { active, completedOn } = budget;
    const completed = completedOn != null;

    return (
      <div>
      <bs.Panel header={`${budget.name} Overview`}>
        <bs.Row>

        <bs.Col md={6} style={{ float: 'right' }}>

          <bs.Button 
            bsStyle='success' 
            style={{ float: 'right' }}
            onClick={() => { goToListView(); }}
            >
            <i className='fa fa-chevron-left' /> Back to all
          </bs.Button>
          {
              !active && completed ? 
                <bs.Button 
                  bsStyle='primary' 
                  style={{float: 'right', marginRight: 25}}
                  onClick={() => { confirmSetBudget(id);  }}
                >
                  Set Budget
                </bs.Button>
                : <div />
            }
            {
              active && completed ?
                <div>            
                  
                  <bs.Button 
                    bsStyle='danger' 
                    style={{float: 'right', marginRight: 25}}
                    onClick={() => { confirmResetBudget(id); }}
                  >
                    Reset Budget
                  </bs.Button>
                  
                  <bs.Button 
                    bsStyle='primary' 
                    style={{float: 'right', marginRight: 25}}
                    onClick={() => { goToActiveView(); }}
                  >
                    Monitor all active
                  </bs.Button>

                </div>
                :
                  <div />
            }
        </bs.Col>
      </bs.Row>
         <hr/>
        <BudgetOverview
          clusters={clusters}
          groups={groups}
          budget={budget}
          query={exploreQuery}
          actions={actions}
          metersLocations={metersLocations}
          tableFields={exploreFields}
          data={exploreData}
          tablePager={explorePager}
        />

      {
        budgetToSet != null ? 
          <Modal
            show
            title='Confirmation'
            text={<span>Are you sure you want to <i>set</i> <b>{budgetToSet.name}</b> (id:{budgetToSet.id}) ?</span>}
            onClose={() => confirmSetBudget(null)}
            actions={[
              {
                name: 'Cancel',
                action: () => confirmSetBudget(null),
              },
              {
                name: 'Set Budget',
                style: 'primary',
                action: () => { setActiveBudget(budgetToSet.id); confirmSetBudget(null); }
              },
            ]}
          />
          :
            <div />
      }
      {
        budgetToReset != null ? 
          <Modal
            show
            title='Confirmation'
            text={<span>Are you sure you want to <i>reset</i> <b>{budgetToReset.name}</b> (id:{budgetToReset.id}) ?</span>}
            onClose={() => confirmResetBudget(null)}
            actions={[
              {
                name: 'Cancel',
                action: () => confirmResetBudget(null),
              },
              {
                name: 'Reset budget',
                style: 'danger',
                action: () => { resetActiveBudget(budgetToReset.id); confirmResetBudget(null); }
              },
            ]}
          />
          :
            <div />
      }
        </bs.Panel>
        
        { 
          completed ? 
            <bs.Panel header={`${budget.name} Details`}>
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
              />
            </bs.Panel> 
              : 
                null
        }
      </div>

    );
  }
});

module.exports = BudgetExplore;
