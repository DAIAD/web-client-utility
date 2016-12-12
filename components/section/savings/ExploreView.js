var React = require('react');
var bs = require('react-bootstrap');
var echarts = require('react-echarts');
var { FormattedTime } = require('react-intl');

var Widget = require('../../WidgetComponent');
var theme = require('../../chart/themes/blue');

function ExploreScenario (props) {
  const { scenario, clusters, groups, metersLocations } = props;
  const { potential, user, createdOn, completedOn, params } = scenario;
  const completed = scenario.completedOn != null;

  const widgets = [{
    id: 1,
    display: 'stat',
    title: 'Details',
    highlight: null,
    info: [{
      key: 'User',
      value: user
    },
    {
      key: 'Created on',
      value: createdOn ? <FormattedTime value={createdOn} minute='numeric' hour='numeric' day='numeric' month='numeric' year='numeric' /> : '-',
    },
    {
      key: 'Completed on',
      value: completedOn ? <FormattedTime value={completedOn} minute='numeric' hour='numeric' day='numeric' month='numeric' year='numeric' /> : '-'
    }]
  },
  {
    id: 2,
    display: 'stat',
    title: 'Parameters',
    highlight: null,
    info: params,
    style: {
      width: 400
    },
    limit: 5

  }
  ];

  if (completed) {
    widgets.push({
      id: 3,
      display: 'stat',
      title: 'Savings Potential',
      highlight: potential,
      info: [],
      footer: 'Set: 1/3/2016',
    });
  
    clusters.forEach((cluster, i) => {
      widgets.push({
        id: i + 4,
        title: cluster.name,
        display: 'chart',
        style: {
          height: 250,
          width: 450
        },
        yAxis: {
          formatter: y => y.toString() + '%',
        },
        xAxis: {
          data: cluster.groups.map(x => x.name)
        },
        series: [
          {
            name: '',
            type: 'bar',
            fill: 0.8,
            data: cluster.groups.map(x => Math.round(Math.random()*50))
          }
        ]
      });
    
    });
    
    widgets.push({
      id: 25,
      display: 'map',
      style: {
        height: 250,
        width: 450
      },
      map: {},
      data: metersLocations && metersLocations.features ? 
        metersLocations.features.map(feature => [feature.geometry.coordinates[1], feature.geometry.coordinates[0], Math.abs(Math.random()-0.8)]) : []
    });
  }

  return (
    <div>
      <bs.Row>
        {
          widgets.map(widget => (
            <div key={widget.id} style={{float: 'left', margin: 20}}>
              <Widget {...widget} />
            </div>
          ))
        }
      </bs.Row>
  </div> 
  );
}

var SavingsPotentialExplore = React.createClass({ 
  componentWillMount: function() {

    if (!this.props.metersLocations) {
      this.props.actions.getMetersLocations();
    }

  },
  render: function() {
    const { scenarios, clusters, actions, metersLocations, params, intl } = this.props;
    const { goToListView, confirmRemoveScenario } = actions;
    const _t = x => intl.formatMessage({ id: x });
    const { id } = params;
    //TODO: normally this would be fetched from API at componentWIllMount
    const scenario = scenarios.find(scenario => scenario.id === id);
    if (!clusters) return null;
    if (scenario == null) {
      return (
        <bs.Panel header={<h3>404</h3>}>
          <bs.Row>
            <bs.Col md={6}>
              <h4>{_t('Savings.Explore.notFound')}</h4>
            </bs.Col>
            <bs.Col md={6} style={{textAlign: 'right'}}>
              <bs.Button bsStyle='success' onClick={() => { goToListView(); }}><i className='fa fa-chevron-left'></i> Back to all</bs.Button>
            </bs.Col>
          </bs.Row> 
        </bs.Panel>
      );
    } 
    return (
      <bs.Panel header={<h3>{scenario.name + _t('Savings.Explore.title')}</h3>}>
        <bs.Row>
        <bs.Col md={6} style={{ float: 'right' }}>

          <bs.Button 
            style={{ float: 'right' }}
            bsStyle='success' 
            onClick={() => { goToListView(); }}
            >
            <i className='fa fa-chevron-left'></i> Back to all
          </bs.Button>
          <bs.Button
            bsStyle='danger'
            style={{ float: 'right', marginRight: 25 }}
            onClick={() => confirmRemoveScenario(id)}
            >
            Delete scenario
          </bs.Button>

        </bs.Col>
      </bs.Row>
         <hr/>
        <ExploreScenario
          clusters={clusters}
          scenario={scenario}
          metersLocations={metersLocations}
        />
      </bs.Panel>
    );
  }
});
               
module.exports = SavingsPotentialExplore;
