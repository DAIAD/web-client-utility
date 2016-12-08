var React = require('react');
var bs = require('react-bootstrap');
var echarts = require('react-echarts');

var { WidgetPanel } = require('../../WidgetComponent');
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
    info: [
      <span><b>User:</b> { user } </span>,
      <span><b>Parameters:</b> { paramsLong } </span>,
      <span><b>Created on:</b> { createdOn ? createdOn.toString() : '-'}</span>,
      <span><b>Completed on:</b> { completedOn ? completedOn.toString() : '-'}</span>,
      <span><b>Completed:</b> {completed ? 'Yes' : 'No'}</span>
    ]
  }];

  if (completed) {
    widgets.push({
      id: 2,
      display: 'stat',
      title: 'Savings Potential',
      highlight: potential,
      info: [],
      footer: 'Set: 1/3/2016',
    });
  
    clusters.forEach((cluster, i) => {
      widgets.push({
        id: i + 4,
        display: 'chart',
        style: {
          height: 250,
          width: 450
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
        <WidgetPanel widgets={widgets} />
      </bs.Row>

      <bs.Row> 
      {
        completed ?
          clusters.map(cluster =>  
            <echarts.LineChart
              width='100%'
              height={200}
              theme={theme}
              xAxis={{
                data: groups.filter(g => g.cluster === cluster.value).map(x => x.label),
                boundaryGap: true, 
              }}
              yAxis={{
                name: 'Savings potential: ' + cluster.label,
                formatter: (y) => (y.toString() + '%'),
                numTicks: 3,
                min: 0,
              }}
              series={[
                {
                  name: '',
                  type: 'bar',
                  fill: 0.8,
                  data: groups.filter(g => g.cluster === cluster.value).map(x => Math.round(Math.random()*50))
                }]
              }
            />
            )
              : <div/>
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
    const { scenarios, groups, clusters, actions, metersLocations, params } = this.props;
    const { goToListView } = actions;
    const { id } = params;
    const scenario = scenarios.find(scenario => scenario.id === id);
    if (scenario == null) {
      return (
        <div>
          <bs.Row>
            <bs.Col md={6}>
              <h4>Sorry, savings scenario not found.</h4>
            </bs.Col>
            <bs.Col md={6} style={{textAlign: 'right'}}>
              <bs.Button bsStyle='success' onClick={() => { goToListView(); }}><i className='fa fa-chevron-left'></i> Back to all</bs.Button>
            </bs.Col>
          </bs.Row> 
        </div>
      );
    } 
    return (
      <div>
        <bs.Row>
          <bs.Col md={6}>
            <h4>Explore {scenario.name}</h4> 
        </bs.Col>
        <bs.Col md={6} style={{textAlign: 'right'}}>
          <bs.Button bsStyle='success' onClick={() => { goToListView(); }}><i className='fa fa-chevron-left'></i> Back to all</bs.Button>
        </bs.Col>
      </bs.Row>
         <hr/>
        <ExploreScenario
          clusters={clusters}
          groups={groups}
          scenario={scenario}
          metersLocations={metersLocations}
        />
        </div>
    );
  }
});
               

module.exports = SavingsPotentialExplore;
