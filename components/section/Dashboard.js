var React = require('react');
var { bindActionCreators } = require('redux');
var { connect } = require('react-redux');
var Bootstrap = require('react-bootstrap');
var { Link } = require('react-router');
var Breadcrumb = require('../Breadcrumb');
var Counter = require('../Counter');
//var Chart = require('../Chart');
var Chart = require('../reports-measurements/chart');
var {configPropType} = require('../../prop-types');
var moment = require('moment');
var LeafletMap = require('../LeafletMap');
var FilterTag = require('../chart/dimension/FilterTag');
var Timeline = require('../Timeline');
var {FormattedTime} = require('react-intl');

var WidthProvider = require('react-grid-layout').WidthProvider;
var ResponsiveReactGridLayout = require('react-grid-layout').Responsive;

var Maximizable = require('../Maximizable');

var _ = require('lodash');

var { getTimeline, getFeatures, getCounters, 
      getChart, getDefaultChart, getProfileLayout, 
      fetchFavouriteQueries, saveLayout} = require('../../actions/DashboardActions');

ResponsiveReactGridLayout = WidthProvider(ResponsiveReactGridLayout);
Chart = Maximizable(Chart);

//var defaultLayout = [
//  { i: 'chart', x: 0, y: 0, w: 12, h: 14, minH: 14, maxH: 14},
//  { i: 'map', x: 0, y: 12, w: 12, h: 20, minH: 20, maxH: 20}
//];
var defaultLayout = [
  { i: 'chart', x: 1, y: 12, w: 12, h: 14},
  { i: 'map', x: 0, y: 0, w: 12, h: 20}
];

//var dashboardWrapper = function (props) {
//    var defaults= {
//      chartProps: {
//        width: '100%',
//        height: 300,
//      }
//    };
//  return class DashboardChannel extends React.Component {
//    render() {
//      return Maximizable(
//          <Chart 
//            {...defaults.chartProps}
//            draw={props.chart.draw} 
//            field={'volume'}
//            level={'week'}
//            reportName={'avg-daily-avg'}
//            finished={props.chart.finished}
//            series={props.chart.data ? props.chart.data : []}
//            context={props.config}
//            scaleTimeAxis={false}
//            maximized={true}
//          />
//      )
//    }
//  }
//}
var getPinnedCharts = function(ob) {
  //if no pinned charts, return default chart
  var charts = [];
  
  //if(!ob){
    var favourite = {
      title:"for dashboard",
      tags:"Chart - Meter",
      reportName:"avg-daily-avg",
      level:"week",
      field:"volume",
      query:{
        time:{
          type:"ABSOLUTE",
          granularity:"WEEK",
          start:moment().subtract(150, 'day').valueOf(),
          end:moment().valueOf(),
          duration:null,
          durationTimeUnit:"HOUR"},
        population:[{
          type:"UTILITY",
          label:"UTILITY:941be15c-a8ea-40c9-8502-9b790d2a99f3",
          ranking:null,
          utility:"941be15c-a8ea-40c9-8502-9b790d2a99f3"}],
        source:"METER",
        metrics:["AVERAGE"]}
    };  
    return [favourite];
  //}
  //return charts;
};

var getPinnedMaps = function(favourites) {
  //if no pinned charts, return default chart
  var maps = [];
  return maps;
}

var _getTimelineValues = function(timeline) {
  if(timeline) {
    return timeline.getTimestamps();
  }
  return [];
};

var _getTimelineLabels = function(timeline) {
  if(timeline) {
    return timeline.getTimestamps().map(function(timestamp) {
      return (
        <FormattedTime  
          value={new Date(timestamp)}
          day='numeric'
          month='numeric'
          year='numeric'/>
      );
    });
  }
  return [];
};

var _onChangeTimeline = function(value, label, index) {
  this.props.actions.getFeatures(index, value);
};

var Dashboard = React.createClass({

  _disabledActionHandler: function(e) {
    e.stopPropagation();
    e.preventDefault();
  },

  contextTypes: {
    intl: React.PropTypes.object,
    config: configPropType,     
  },

  componentWillMount : function() {

    this.props.actions.getProfileLayout();
    this.props.actions.fetchFavouriteQueries();

  },

  componentDidMount : function() {

    var utility = this.props.profile.utility;

    if(!this.props.map.timeline) {
      this.props.actions.getTimeline(utility.key, utility.name, utility.timezone);
    }

    this.props.actions.getCounters();

  },
  
  componentWillUnmount : function() {
    //
  },

  toggleSize() {
    console.log(this);
  },
  
  unpin() {
    console.log(this);
  },
  
  render: function() {

    var pinnedCharts;
    if(this.props.favourites){
      pinnedCharts = getPinnedCharts(this);
    }
    
//    var ctitles,
//    for(var k=0; k<pinnedCharts.length; k++){
//      
//    }
    var chartTitle = (
      <span>
        <i key='chart1' className='fa fa-bar-chart fa-fw'></i>
        <span style={{ paddingLeft: 4 }}>Last 2 Week Consumption</span>
        <span style={{float: 'right',  marginTop: -3, marginLeft: 5 }}>
          <Bootstrap.Button  
            bsStyle='default' 
            className='btn-circle'
            onClick={this.unpin}
            >
            <i className='fa fa-remove fa-fw'></i>
          </Bootstrap.Button>
        </span>
        <span style={{float: 'right',  marginTop: -3, marginLeft: 5 }}>
          <Bootstrap.Button  
            bsStyle='default' 
            className='btn-circle'
            onClick={this.toggleSize}
            >
            <i className='fa fa-arrows-alt fa-fw'></i>
          </Bootstrap.Button>
        </span>
      </span>
    );

    var mapTitle = (
      <span>
        <i className='fa fa-map fa-fw'></i>
        <span style={{ paddingLeft: 4 }}>Last 2 Week Consumption</span>
        <span style={{float: 'right',  marginTop: -3, marginLeft: 5 }}>
          <Bootstrap.Button  
            bsStyle='default' 
            className='btn-circle'
            onClick={this.toggleSize}
            >
            <i className='fa fa-arrows-alt fa-fw'></i>
          </Bootstrap.Button>
        </span>
      </span>
    );

    var intervalLabel ='';
    if(this.props.interval) {
      var start = this.props.interval[0].format('DD/MM/YYYY');
      var end = this.props.interval[1].format('DD/MM/YYYY');
      intervalLabel = start + ' - ' + end;
      if (start === end) {
        intervalLabel = start;
      }
    }

    var chart = null, chartFilterTags = [], map, mapFilterTags = [];

    chartFilterTags.push(
      <FilterTag key='time' text={intervalLabel} icon='calendar' />
    );
    chartFilterTags.push(
      <FilterTag key='source' text='Meter' icon='database' />
    );

    var defaults= {
      chartProps: {
        width: '100%',
        height: 300,
      }
    };

//    var chartMx = dashboardWrapper(this.props);
//    chart = (
//      <Bootstrap.ListGroupItem className="report-chart-wrapper">
//      {chartMx}
//      </Bootstrap.ListGroupItem>       
//    );
    chart = (
      <Bootstrap.ListGroupItem className="report-chart-wrapper">
        <Chart 
          {...defaults.chartProps}
          draw={this.props.chart.draw} 
          field={'volume'}
          level={'week'}
          reportName={'avg-daily-avg'}
          finished={this.props.chart.finished}
          series={this.props.chart.data ? this.props.chart.data : []}
          context={this.props.config}
          scaleTimeAxis={false}
        />
      </Bootstrap.ListGroupItem>              
    ); 

    mapFilterTags.push(
      <FilterTag key='time' text={intervalLabel} icon='calendar' />
    );
   
    mapFilterTags.push(
      <FilterTag key='spatial' text='Alicante' icon='map' />
    );
   
    mapFilterTags.push(
      <FilterTag key='source' text='Meter' icon='database' />
    );

    map = (
      <Bootstrap.ListGroup fill>
        <Bootstrap.ListGroupItem>
          <LeafletMap 
            style={{ width: '100%', height: 600}}
            elementClassName='mixin'
            prefix='map'
            center={[38.36, -0.479]}
            zoom={13}
            mode={LeafletMap.MODE_CHOROPLETH}
            choropleth= {{
              colors : ['#2166ac', '#67a9cf', '#d1e5f0', '#fddbc7', '#ef8a62', '#b2182b'],
                min : this.props.map.timeline ? this.props.map.timeline.min : 0,
                max : this.props.map.timeline ? this.props.map.timeline.max : 0,
                data : this.props.map.features
            }}
            overlays={[{ url : '/assets/data/meters.geojson', popupContent : 'serial'}]}
          />
        </Bootstrap.ListGroupItem>
        <Bootstrap.ListGroupItem>
          <Timeline   
            onChange={_onChangeTimeline.bind(this)}
            labels={ _getTimelineLabels(this.props.map.timeline) }
            values={ _getTimelineValues(this.props.map.timeline) }
            defaultIndex={this.props.map.index}
            speed={1000}
            animate={false}>
          </Timeline>
        </Bootstrap.ListGroupItem>
        <Bootstrap.ListGroupItem className='clearfix'>
          <div className='pull-left'>
            {mapFilterTags}
          </div>
          <span style={{ paddingLeft : 7}}> </span>
          <Link className='pull-right' to='/analytics' style={{ paddingLeft : 7, paddingTop: 12 }}>View analytics</Link>
        </Bootstrap.ListGroupItem>   
      </Bootstrap.ListGroup>
    );

    var counters = this.props.counters;

    var counterComponents = (
      <div className='row'>
        <div className='col-md-4'>
          <div style={{ marginBottom: 20 }}>
            <Counter text={'Counter.Users'}
                     value={((counters) && (counters.user)) ? counters.user.value : null}
                     variance={((counters) && (counters.user)) ? counters.user.difference : null} link='/users' />
          </div>
        </div>
        <div className='col-md-4'>
          <div style={{ marginBottom: 20 }}>
            <Counter text={'Counter.Meters'}
                     value={((counters) && (counters.meter)) ? counters.meter.value : null}
                     variance={((counters) && (counters.meter)) ? counters.meter.difference : null} color='#1abc9c' link='/users'/>
          </div>
        </div>
        <div className='col-md-4'>
          <div style={{ marginBottom: 20 }}>
            <Counter text={'Counter.Devices'}
                     value={((counters) && (counters.amphiro)) ? counters.amphiro.value : null}
                     variance={((counters) && (counters.amphiro)) ? counters.amphiro.difference : null} color='#27ae60' link='/users' />
          </div>
        </div>
      </div>
    );

//    var counter2 = (
//      <ChartBox 
//        {...infobox} 
//         width={this.state.el ? this.state.el.clientWidth : '100%'}
//         height={this.state.el ? this.state.el.clientHeight - 90 : null}
//      /> 
//    );


    var chartPanel = ( <div /> );
    //if(this.props.chart.data) {
      chartPanel = (
          <Bootstrap.Panel header={chartTitle}>
            <Bootstrap.ListGroup fill>
              {chart}
              <Bootstrap.ListGroupItem className='clearfix'>
                <div className='pull-left'>
                  {chartFilterTags}
                </div>
                <span style={{ paddingLeft : 7}}> </span>
                <Link className='pull-right' to='/analytics' style={{ paddingLeft : 7, paddingTop: 12 }}>View analytics</Link>
              </Bootstrap.ListGroupItem>
            </Bootstrap.ListGroup>
          </Bootstrap.Panel>
      );
    //}

    var mapPanel = (
      <Bootstrap.Panel header={mapTitle}>
        {map}
      </Bootstrap.Panel>
    );

    var layouts = {
      lg : this.props.savedLayout
    };

    var onLayoutChange = function(e) {
    };

    var onBreakpointChange = function(e) {
      console.log('onBreakpointChange');
      console.log(e);
    };

    var onResizeStop = function(e) {
    };

    var onDragStop = function(e) {
      //todo - if maximize/minimize action, do nothing
      var changed = [];
      for(let k=0; k<defaultLayout.length; k++){
        var lay = defaultLayout[k];
        for(let l=0; l<e.length; l++){
          if(e[l].i == defaultLayout[k].i){
            //we don t allow side by side components in layout because of resizing discrepancies
            //lay.x = e[l].x;  
            lay.y = e[l].y;
          }
        }
        changed.push(lay);
      }
      
      var layoutString = JSON.stringify({"layout": changed});
      var defaultProfileData = {"configuration" : layoutString};
      
      this.props.actions.saveLayout(defaultProfileData);
    };

    //layout not loaded yet
    if(!this.props.savedLayout){
      return(<div> </div>);
    } else if(this.props.savedLayout.lg){
      return(<div> </div>);
    }

    return (
      <div className='container-fluid' style={{ paddingTop: 10 }}>
        <div className='row'>
          <div className='col-md-12'>
            <Breadcrumb routes={this.props.routes}/>
          </div>
        </div>
        {counterComponents}
        <div className='row' style={{ overflow : 'hidden' }}>
          <ResponsiveReactGridLayout  
            className='clearfix'
            layouts={layouts}
            rowHeight={30}
            onLayoutChange={onLayoutChange.bind(this)}
            onBreakpointChange={onBreakpointChange.bind(this)}
            onResizeStop={onResizeStop.bind(this)}
            onDragStop={onDragStop.bind(this)}
            breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}}
            cols={{lg: 12, md: 10, sm: 6, xs: 4, xxs: 2}}
            autoSize={true}
            verticalCompact={true}
            isResizable={false}
            measureBeforeMount
            draggableHandle='.panel-heading'>
             
            <div key='chart' className='draggable'>
              {chartPanel}
            </div>        
            <div key='map' className='draggable'>
              {mapPanel}
            </div>
          </ResponsiveReactGridLayout>
        </div>
      </div>
     );
    }
});

Dashboard.icon = 'dashboard';
Dashboard.title = 'Section.Dashboard';

function mapStateToProps(state) {

  return {
    interval: state.dashboard.interval,
    map: state.dashboard.map,
    chart: state.dashboard.chart,
    counters: state.dashboard.statistics.counters,
    profile: state.session.profile,
    routing: state.routing,
    config: state.config,
    defaultChart : state.dashboard.defaultChart,
    savedLayout: state.dashboard.savedLayout,
    favourites: state.dashboard.favourites
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions : bindActionCreators(Object.assign({}, { getTimeline, getFeatures, getCounters,
                                                     getChart, getDefaultChart, fetchFavouriteQueries,  
                                                     getProfileLayout, saveLayout }) , dispatch)
  };
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(Dashboard);
