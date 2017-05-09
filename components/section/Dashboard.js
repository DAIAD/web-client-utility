var React = require('react');
var { bindActionCreators } = require('redux');
var { connect } = require('react-redux');
var Bootstrap = require('react-bootstrap');
var { Link } = require('react-router');
var Counter = require('../Counter');

var Chart = require('../reports-measurements/chart');
var {configPropType} = require('../../prop-types');
var moment = require('moment');
var FilterTag = require('../chart/dimension/FilterTag');
var Timeline = require('../Timeline');
var {FormattedTime} = require('react-intl');

var { Map, TileLayer, GeoJSON, Choropleth, LayersControl, InfoControl } = require('react-leaflet-wrapper');

var WidthProvider = require('react-grid-layout').WidthProvider;
var ResponsiveReactGridLayout = require('react-grid-layout').Responsive;
//var Maximizable = require('../Maximizable');

var { getTimeline, getFeatures, getCounters, getProfileLayout, fetchFavouriteQueries, saveLayout, unpin, getChart } = require('../../actions/DashboardActions');
var { getMetersLocations } = require('../../actions/MapActions');

ResponsiveReactGridLayout = WidthProvider(ResponsiveReactGridLayout);
//Chart = Maximizable(Chart);

var defaultChartTitle = "Last 30 Days Average Consumption";
var defaultMapTitle = "Last 30 Days Consumption";

var getDefaultChart = function(props) {
  var defaultChart = {
    id: 100000,
    title:defaultChartTitle,
    type:"CHART",
    tags:"Chart - Meter",
    reportName:"avg",
    level:"day",
    field:"volume",
    queries:[{
      time:{
        type:"ABSOLUTE",
        granularity:"DAY",
        start:moment().subtract(30, 'day').valueOf(),
        end:moment().valueOf(),
        durationTimeUnit:"HOUR"},
      population:[{
        type:"UTILITY",
        label:"UTILITY:" + props.profile.utility.key,
        ranking:null,
        utility:props.profile.utility.key}],
      source:"METER",
      metrics:["AVERAGE"]
    }]
  };
  return defaultChart;
}

var getDefaultMap = function(props) {
  var defaultMap = {
    id: 100001,
    title:defaultMapTitle,
    type:"MAP",
    tags:"Map - Meter",
    queries:[{
      time:{
        type:"ABSOLUTE",
        granularity:"DAY",
        start:moment().subtract(350, 'day').valueOf(),
        end:moment().valueOf(),
        durationTimeUnit:"HOUR"},
      population:[{
        type:"UTILITY",
        label:"Utility",
        ranking:null,
        utility:props.profile.utility.key}],
      source:"METER",
      metrics:["SUM"]
    }]
  };
  return defaultMap;
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

var _onChangeTimeline = function(title, id, value, label, index) {
  this.props.actions.getFeatures(index, value, null, id);
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

  componentWillMount: function() {
    this.props.actions.getProfileLayout();  
    //fetch meter geojson data
    if (!this.props.metersLocations) {
      this.props.actions.getMetersLocations();
    }
    
  },
  componentDidMount : function() {

    this.props.actions.fetchFavouriteQueries(this.props);
    this.props.actions.getCounters();
  },

  toggleSize : function() {
    //console.log(this);
  },

  _unpin : function(fav, e) {
    var request =  {
      'namedQuery' : fav
    };
    this.props.actions.unpin(request, this.props);
  },

  createChartComponents : function (pinnedCharts) {

    var props = this.props;
    var defaults= {
      chartProps: {
        width: '100%',
        height: 300,
      }
    };

    var chPanels = [];
    pinnedCharts.push(getDefaultChart(this.props));
    
    for(var i=0; i<pinnedCharts.length; i++){
    
      var pCharts = props.chart.length > 0 ? 
          props.chart.filter(function(propChart) { return propChart.id === pinnedCharts[i].id; }) : [];
          
      var pChart = pCharts[0];

      if(!pChart){
        return [];
      }  

      var unpinButton = pChart.id === 100000 ? null : (
        <Bootstrap.Button 
            bsStyle='default'
            className='btn-circle'
            onClick={this._unpin.bind(this, pChart)}
            type='button'
            >
            <i className='fa fa-remove fa-fw'></i>
          </Bootstrap.Button>
      );
//maximize button
//        <span style={{float: 'right',  marginTop: -3, marginLeft: 5 }}>
//          <Bootstrap.Button  
//            bsStyle='default' 
//            className='btn-circle'
//            onClick={this.toggleSize}
//            >
//            <i className='fa fa-arrows-alt fa-fw'></i>
//          </Bootstrap.Button>
//        </span>     
      var chartTitle = (
      <span>
        <i key={pChart.title} className='fa fa-bar-chart fa-fw'></i>
        <span style={{ paddingLeft: 4 }}>{pChart.title}</span>
        <span style={{float: 'right',  marginTop: -3, marginLeft: 5 }}>
          {unpinButton}
        </span>

      </span>
      );

      //todo - in case of overlaping query, define way of showing interval
      var intervalLabel =' ... ';
      if(pChart.data) {
        var start = moment(pChart.data[0].timespan[0]).format('DD/MM/YYYY');
        var end = moment(pChart.data[0].timespan[1]).format('DD/MM/YYYY');
        intervalLabel = start + ' - ' + end;
        if (start === end) {
          intervalLabel = start;
        }
      }

      var chartFilterTags =[];
      chartFilterTags.push(
        <FilterTag key='time' text={intervalLabel} icon='calendar' />
      );
      chartFilterTags.push(
        <FilterTag key='source' text={pChart.data ? pChart.data[0].source : ' ... '} icon='database' />
      );

      var overlap, overlapping;
      if(pinnedCharts[i].overlap){
         overlap = {value:pinnedCharts[i].overlap, label: pinnedCharts[i].overlap};
         overlapping = true;
      } else {
         overlap = null;
         overlapping = false;
      }      
      var chart = (
        <Chart 
          {...defaults.chartProps}
          width={this.chartEl && this.chartEl.clientWidth || '100%'}
          draw={pChart.draw} 
          field={'volume'}
          level={pinnedCharts[i].level}
          reportName={pinnedCharts[i].reportName}
          finished={pChart.finished}
          series={pChart.data}
          context={props.config}
          scaleTimeAxis={false}
          overlapping={overlapping}
          overlap={overlap}
        />
      ); 
     var link = (
       <Link className='pull-right' to='/analytics/panel' style={{ paddingLeft : 7, paddingTop: 12 }}>View Chart Analytics</Link>
     ); 
      var chartPanel = (
      <Bootstrap.Panel header={chartTitle}>
        <Bootstrap.ListGroup fill>
          <Bootstrap.ListGroupItem className="report-chart-wrapper">
          {chart}
          </Bootstrap.ListGroupItem>
          <Bootstrap.ListGroupItem className='clearfix'>
            <div className='pull-left'>
              {chartFilterTags}
            </div>
            <span style={{ paddingLeft : 7}}> </span>
           {link}
          </Bootstrap.ListGroupItem>
        </Bootstrap.ListGroup>
      </Bootstrap.Panel>
      );
      var cPanelWithKey = {panel:chartPanel, key:pChart.title};
      chPanels.push(cPanelWithKey);
    }

    return chPanels;
  },

  createMapComponents : function (pinnedMaps) {

    var props = this.props;
    var mPanels = [];
    pinnedMaps.push(getDefaultMap(this.props));
    for(var i=0; i<pinnedMaps.length; i++){

      //todo - merge returned pMap with its corresponding pinned object 
      //to keep info about timespan and source for the tags
      var pMaps = props.map.length > 0 ? 
          props.map.filter(function(propMap) { return propMap.id === pinnedMaps[i].id; }) : [];

      var pMap = pMaps[0];

      if(!pMap){
        return [];
      }

      var unpinButton = pMap.id === 100001 ? null : (
        <Bootstrap.Button 
            bsStyle='default'
            className='btn-circle'
            onClick={this._unpin.bind(this, pMap)}
            type='button'
            >
            <i className='fa fa-remove fa-fw'></i>
          </Bootstrap.Button>
      );
  
      var mapTitle = (
      <span>
        <i className='fa fa-map fa-fw'></i>
        <span style={{ paddingLeft: 4 }}>{pMap? pMap.title : 'Loading...'}</span>
        <span style={{float: 'right',  marginTop: -3, marginLeft: 5 }}>
          {unpinButton}
        </span>

      </span>
      );

      var intervalLabel ='';
      if(props.interval) {
        var start = moment(pinnedMaps[i].queries[0].time.start).format('DD/MM/YYYY');
        var end = moment(pinnedMaps[i].queries[0].time.end).format('DD/MM/YYYY');
        intervalLabel = start + ' - ' + end;
        if (start === end) {
          intervalLabel = start;
        }
      }

      var mapFilterTags = [];
      mapFilterTags.push(
        <FilterTag key='time' text={intervalLabel} icon='calendar' />
      );

      mapFilterTags.push(
        <FilterTag key='spatial' text='Alicante' icon='map' />
      );

      mapFilterTags.push(
        <FilterTag key='source' text='Meter' icon='database' />
      );
     
     var link = (
       <Link className='pull-right' to='analytics/map' style={{ paddingLeft : 7, paddingTop: 12 }}>View Map Analytics</Link>
     );
    
     const timelineMin = pMap && pMap.timeline && pMap.timeline.min || 0;
     const timelineMax = pMap && pMap.timeline && pMap.timeline.max || 0;
     
     var timelineLabels =_getTimelineLabels(pMap.timeline);
     var timelineValues =_getTimelineValues(pMap.timeline);

     var timeline = timelineLabels.length>0? (
       <Timeline   
         onChange={_onChangeTimeline.bind(this, pMap.title, pMap.id)}
         labels={pMap ? timelineLabels : []}
         values={pMap ? timelineValues : []}
         defaultIndex={pMap ? pMap.index : 0}
         speed={1000}
         animate={false}
       />
     ) : null;
    
     var map = (
      <Bootstrap.ListGroup fill>
        <Bootstrap.ListGroupItem>
          <Map
            center={[38.36, -0.479]}
            zoom={13}
            width='100%'
            height={400}
            >
            <TileLayer />
            <InfoControl position='topright'> 
              <Choropleth
                name='Areas'
                data={pMap ? pMap.features : null}
                legend={timelineMax === 0 ? null : 'bottomright'}
                valueProperty='value'
                scale={['white', 'red']}
                limits={[timelineMin, timelineMax]}
                steps={6}
                mode='e'
                infoContent={feature => feature ? 
                  <div>
                    <h5>{feature.properties.label}</h5>
                    <span>{feature.properties.value}</span>
                  </div> 
                    : <div><h5>Hover over an area...</h5></div>
                  }
                highlightStyle={{ weight: 4 }}
                style={{
                  fillColor: "#ffff00",
                  color: "#000",
                  weight: 3,
                  opacity: 1,
                  fillOpacity: 0.5
                }}
              />
            </InfoControl>
            <GeoJSON
              name='Meters'
              data={this.props.metersLocations}
              popupContent={feature => 
                <div>
                  <h5>Serial:</h5>
                  <h5>{feature.properties.serial}</h5>
                </div>
                }
              circleMarkers
              style={{
                radius: 8,
                fillColor: "#ff7800",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
              }}
            />
          </Map>
        </Bootstrap.ListGroupItem>
        <Bootstrap.ListGroupItem>
          {timeline}
        </Bootstrap.ListGroupItem>
        <Bootstrap.ListGroupItem className='clearfix'>
          <div className='pull-left'>
            {mapFilterTags}
          </div>
          <span style={{ paddingLeft : 7}}> </span>
            {link}
        </Bootstrap.ListGroupItem>   
      </Bootstrap.ListGroup>
    );      

    var mapPanel = (
      <Bootstrap.Panel header={mapTitle}>
        {map}
      </Bootstrap.Panel>
    );

    var mPanelWithKey = {panel:mapPanel, key:pinnedMaps[i].title};
      mPanels.push(mPanelWithKey);
    }
    
    return mPanels;
  },
  
  createForecastComponents : function (pinnedForecasts) {

    var props = this.props;
    var defaults= {
      chartProps: {
        width: '100%',
        height: 300,
      }
    };

    var forPanels = [];

    for(var i=0; i<pinnedForecasts.length; i++){
      var pCharts = props.chart.length > 0 ? 
          props.chart.filter(function(propChart) { return propChart.id === pinnedForecasts[i].id; }) : [];
          
      var pChart = pCharts[0];

      if(!pChart){
        return [];
      }  

      var unpinButton = pChart.id === 100000 ? null : (
        <Bootstrap.Button 
            bsStyle='default'
            className='btn-circle'
            onClick={this._unpin.bind(this, pChart)}
            type='button'
            >
            <i className='fa fa-remove fa-fw'></i>
          </Bootstrap.Button>
      );
      var chartTitle = (
      <span>
        <i key={pChart.title} className='fa fa-bar-chart fa-fw'></i>
        <span style={{ paddingLeft: 4 }}>{pChart.title}</span>
        <span style={{float: 'right',  marginTop: -3, marginLeft: 5 }}>
          {unpinButton}
        </span>
      </span>
      );

      var intervalLabel =' ... ';
      if(pChart.data) {
        var start = moment(pChart.data[0].timespan[0]).format('DD/MM/YYYY');
        var end = moment(pChart.data[0].timespan[1]).format('DD/MM/YYYY');
        intervalLabel = start + ' - ' + end;
        if (start === end) {
          intervalLabel = start;
        }
      }

      var chartFilterTags =[];
      chartFilterTags.push(
        <FilterTag key='time' text={intervalLabel} icon='calendar' />
      );
      chartFilterTags.push(
        <FilterTag key='source' text={pChart.data ? pChart.data[0].source : ' ... '} icon='database' />
      );

      var chart = (
        <Chart 
          {...defaults.chartProps}
          width={this.chartEl && this.chartEl.clientWidth || '100%'}
          draw={pChart.draw} 
          field={'volume'}
          level={'week'}
          reportName={'avg-daily-avg'}
          finished={pChart.finished}
          series={pChart.data}
          context={props.config}
          scaleTimeAxis={false}
        />
      ); 
     var link = (
       <Link className='pull-right' to='/forecasting' style={{ paddingLeft : 7, paddingTop: 12 }}>View Forecast</Link>
     ); 
      var chartPanel = (
      <Bootstrap.Panel header={chartTitle}>
        <Bootstrap.ListGroup fill>
          <Bootstrap.ListGroupItem className="report-chart-wrapper">
          {chart}
          </Bootstrap.ListGroupItem>
          <Bootstrap.ListGroupItem className='clearfix'>
            <div className='pull-left'>
              {chartFilterTags}
            </div>
            <span style={{ paddingLeft : 7}}> </span>
           {link}
          </Bootstrap.ListGroupItem>
        </Bootstrap.ListGroup>
      </Bootstrap.Panel>
      );
      var cPanelWithKey = {panel:chartPanel, key:pChart.title};
      forPanels.push(cPanelWithKey);
    }

    return forPanels;
  },

  render: function() {

    if(!this.props.savedLayout){
      return (<div> Loading... </div>)
    }

    var pinnedComponents, pinnedCharts, pinnedMaps, pinnedForecasts, divCharts, divMaps, divForecasts;

    if(this.props.favourites){
      pinnedComponents = this.props.favourites.filter(fav => fav.pinned === true);

      pinnedCharts = pinnedComponents.filter(fav => fav.type === "CHART");
      pinnedMaps = pinnedComponents.filter(fav => fav.type === "MAP");
      pinnedForecasts = pinnedComponents.filter(fav => fav.type === "FORECAST");

      divCharts = this.createChartComponents(pinnedCharts);
      divMaps = this.createMapComponents(pinnedMaps);
      divForecasts = this.createForecastComponents(pinnedForecasts);
    }

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

    var onLayoutChange = function(e) {
      //console.log('onLayoutChange');
      //console.log(e);
    };

    var onBreakpointChange = function(e) {
      //console.log('onBreakpointChange');
      //console.log(e);
    };

    var onResizeStop = function(e) {
      //console.log('onResizeStop');
      //console.log(e);
    };

    var onDragStop = function(e) {
      //compare previous with current layouts and prevent from saving
      if(JSON.stringify(e) !== JSON.stringify(this.props.savedLayout)){

        var layoutString = JSON.stringify({"layout": e});
        var layoutRequest = {"configuration" : layoutString};
        this.props.actions.saveLayout(layoutRequest);
      }
    };

    var chartComponents = divCharts ? divCharts : [];
    var mapComponents = divMaps ? divMaps : [];
    var forecastComponents = divForecasts ? divForecasts : [];

    var lCharts = chartComponents ?
      chartComponents.map( 
        chart => (
          <div 
            key={chart.key} 
            ref={(el) => { this.chartEl = el; }}
            className='draggable'
          >
            {chart.panel}
          </div>
        )
      ) : null;
            
    var lMaps = mapComponents ?
      mapComponents.map( 
        map => (
          <div key={map.key} className='draggable'>
            {map.panel}
          </div>
        )
      ) : null;
            
    var lForecasts = forecastComponents ?
      forecastComponents.map( 
        forecast => (
          <div key={forecast.key} className='draggable'>
            {forecast.panel}
          </div>
        )
      ) : null;

     var components = [...lCharts, ...lMaps, ...lForecasts];
    if(components.length !== this.props.savedLayout.length) {
      return (<div>Loading...</div>);
    }

    return (
      <div className='container-fluid' style={{ paddingTop: 10 }}>
        {counterComponents}
        <div className='row' >
          <ResponsiveReactGridLayout  
            className="clearfix"
            rowHeight={600}
            onLayoutChange={onLayoutChange.bind(this)}
            onBreakpointChange={onBreakpointChange.bind(this)}
            onResizeStop={onResizeStop.bind(this)}
            onDragStop={onDragStop.bind(this)}
            layouts={{ lg: this.props.savedLayout, md: this.props.savedLayout, sm: this.props.savedLayout }}
            breakpoints={{ lg: 2160, md: 1080, sm: 720, xs: 480, xxs: 200 }}  //lg: 1080, md: 650, sm: 200
            cols={{lg: 24, md: 20, sm: 16, xs: 12, xxs: 8}}  //lg: 16, md: 12, sm: 8, xs: 6, xxs: 4
            autoSize={true}
            verticalCompact={true}
            isResizable={false}
            measureBeforeMount
            draggableHandle='.panel-heading'
            draggable 
            >
            {components}
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
    savedLayout: state.dashboard.savedLayout,
    favourites: state.dashboard.favourites,
    isLoading : state.dashboard.isLoading,
    metersLocations: state.map.metersLocations,
    width: state.viewport.width
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions : bindActionCreators(Object.assign({}, { getFeatures, getCounters, fetchFavouriteQueries,  
                                                     getProfileLayout, saveLayout, unpin, getMetersLocations }) , dispatch)
                                                     //actions : bindActionCreators(Object.assign({}, { getTimeline, getFeatures, getCounters, getChart, getMetersLocations }) , dispatch)
  };
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(Dashboard);




