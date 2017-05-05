var React = require('react');
var bs = require('react-bootstrap');
var echarts = require('react-echarts');
var { FormattedTime } = require('react-intl');

var WidgetRow = require('../../WidgetRow');
var theme = require('../../chart/themes/blue-palette');
console.log('theme:', theme);
var SavingsPotentialExplore = React.createClass({ 
  componentWillMount: function() {
    if (!this.props.metersLocations || !this.props.metersLocations.features) {
      this.props.actions.getMetersLocations();
    }
  },
  render: function() {
    const { scenarios, clusters, actions, metersLocations, params, viewportWidth, viewportHeight, intl } = this.props;
    const { goToListView, confirmRemoveScenario } = actions;
    const _t = x => intl.formatMessage({ id: x });
    
    const { id } = params;
    const scenario = scenarios.find(scenario => scenario.key === id);

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
  
    const { key: scenarioId, name, createdOn, processingEndOn, owner, params:parameters, paramsShort, potential } = scenario; 
    const completed = processingEndOn != null;
    const details = [{
      id: 1,
      display: 'stat',
      title: 'Details',
      highlight: null,
      info: [{
        key: 'User',
        value: owner,
      },
      {
        key: 'Created on',
        value: createdOn ? <FormattedTime value={createdOn} minute='numeric' hour='numeric' day='numeric' month='numeric' year='numeric' /> : '-',
      },
      {
        key: 'Completed on',
        value: processingEndOn ? <FormattedTime value={processingEndOn} minute='numeric' hour='numeric' day='numeric' month='numeric' year='numeric' /> : '-'
      }]
    },
    {
      id: 2,
      display: 'stat',
      title: 'Parameters',
      dialogClassName: 'maximized-modal-half',
      highlight: null,
      maximizable: true,
      info: paramsShort,
      maximizedProps: {
        info: parameters
      },
      maximizedStyle: {
        padding: 10,
        height: '10vh',
        fontSize: '1.5em'
      },
      limit: 5

    }];

    const stats = [];

    if (completed) {
      details.push({
        id: 3,
        display: 'stat',
        title: 'Savings Potential',
        highlight: potential,
        info: [],
        footer: null,
      });
      
      clusters.forEach((cluster, i) => {
        stats.push({
          id: i + 4,
          title: cluster.name,
          display: 'chart',
          maximizable: true,
          viewportWidth,
          viewportHeight,
          style: {
            height: 200,
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
              data: cluster.groups.map(x => Math.round(Math.random()*50))
            }
          ]
        });
      
      });
      
      stats.push({
        id: 25,
        display: 'map',
        title: 'Map',
        maximizable: true,
        style: {
          height: 238,
        },
        map: {},
        data: metersLocations && metersLocations.features ? 
          metersLocations.features.map(feature => [feature.geometry.coordinates[1], feature.geometry.coordinates[0], Math.abs(Math.random()-0.8)]) : []
      });
    }

    return (
      <div>
        <bs.Panel header={<h3>{name + _t('Savings.Explore.overview')}</h3>}>
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
              onClick={() => confirmRemoveScenario(scenarioId)}
              >
              { _t('Savings.Explore.delete') }
            </bs.Button>
          </bs.Col>
        </bs.Row>
        <hr/>
        <WidgetRow
          widgets={details}
        />
      </bs.Panel>

      { 
        completed ?
          <div>
            <bs.Panel header={<h3>{_t('Savings.Explore.stats')}</h3>}>
              <WidgetRow
                itemsPerRow={2}
                widgets={stats}
              />
            </bs.Panel>
          </div>
            :
              <div />
      }
    </div>
    );
  }
});
               
module.exports = SavingsPotentialExplore;
