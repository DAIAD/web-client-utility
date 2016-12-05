var React = require('react');
var { bindActionCreators } = require('redux');
var { connect } = require('react-redux');
var Bootstrap = require('react-bootstrap');
var { Link } = require('react-router');
var Breadcrumb = require('../Breadcrumb');
var Select = require('react-select');
var DateRangePicker = require('react-bootstrap-daterangepicker');
var FilterTag = require('../chart/dimension/FilterTag');
var Timeline = require('../Timeline');
var GroupSearchTextBox = require('../GroupSearchTextBox');
var {FormattedTime} = require('react-intl');
var moment = require('moment');

var { Map, TileLayer, GeoJSON, Choropleth, LayersControl, InfoControl, DrawControl } = require('react-leaflet-wrapper');

var { getTimeline, getFeatures, getChart,
      setEditor, setEditorValue,
      setTimezone, addFavourite, updateFavourite, setEditorValuesBatch, getMetersLocations } = require('../../actions/MapActions');

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
        <FormattedTime  value={new Date(timestamp)}
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

var _onIntervalEditorChange = function (event, picker) {
  this.props.defaultFavouriteValues.interval = false;
  this.props.actions.setEditorValue('interval', [picker.startDate, picker.endDate]);
};

var _onSourceEditorChange = function (e) {
  this.props.defaultFavouriteValues.source = false;
  this.props.actions.setEditorValue('source', e.value);
};

var onPopulationEditorChange = function(e) {
  this.props.defaultFavouriteValues.population = false;
  if(!e) {
    var utility = this.props.profile.utility;

    e = {
      key: utility.key,
      name: utility.name,
      type: 'UTILITY'
    };
  }
  this.props.actions.setEditorValue('population', e);
};

var _setEditor = function(key) {
  this.props.actions.setEditor(key);
};

var _onFeatureChange = function(features) {
  if((!features) || (features.length===0)){
    this.props.actions.setEditorValue('spatial', null);
  } else {
    this.props.actions.setEditorValue('spatial', features[0].geometry);
  }
};

var AnalyticsMap = React.createClass({

  contextTypes: {
      intl: React.PropTypes.object
  },

  componentWillMount : function() {
    var isDefault;
    if(this.props.favourite){
      isDefault = false;
      this.props.defaultFavouriteValues.interval = true;
      this.props.defaultFavouriteValues.source = true;
      this.props.defaultFavouriteValues.population = true;
      this.props.defaultFavouriteValues.spatial = true;

      this.props.actions.setEditorValuesBatch(isDefault);
    }
    else{
      isDefault = true;
      this.props.defaultFavouriteValues.interval = false;
      this.props.defaultFavouriteValues.source = false;
      this.props.defaultFavouriteValues.population = false;
      this.props.defaultFavouriteValues.spatial = false;

      this.props.actions.setEditorValuesBatch(isDefault);
    }

    if (!this.props.metersLocations) {
      this.props.actions.getMetersLocations();
    }

    var utility = this.props.profile.utility;

    this.props.actions.setTimezone(utility.timezone);

    if(!this.props.map.timeline) {
      var population = {
          utility: utility.key,
          label: utility.name,
          type: 'UTILITY'
      };
      this.props.actions.getTimeline(population);
    }
  },

  componentDidMount : function() {
  },

  clickedAddFavourite : function() {

    var tags = 'Map - ' +
      (this.props.defaultFavouriteValues.source ? this.props.favourite.query.source : this.props.source) +
        ' - '+ this.props.interval[0].format("DD/MM/YYYY") +
          ' to ' + this.props.interval[1].format("DD/MM/YYYY") +
            (this.props.population ? ' - ' + this.props.population.label : '') +
              (this.props.geometry ? ' - Custom' : '');

    var namedQuery = this.props.map.query;
    namedQuery.type = 'Map';
    namedQuery.tags = tags;
    namedQuery.title = this.refs.favouriteLabel.value;

    var request =  {
      'namedQuery' : namedQuery
    };

    if(this.props.favourite){
      namedQuery.id = this.props.favourite.id;
      this.props.actions.updateFavourite(request);
    }
    else{
      this.props.actions.addFavourite(request);
    }
  },

  render: function() {
    var favouriteIcon;
    if(this.props.favourite && this.props.favourite.type == 'CHART'){
      favouriteIcon = 'star-o';
    } else if(this.props.isBeingEdited && !this.props.favourite){
      favouriteIcon = 'star-o';
    }
    else {
      favouriteIcon = 'star';
    }

    var tags = 'Map - ' +
      (this.props.defaultFavouriteValues.source ? this.props.favourite.query.source : this.props.source) +
        ' - '+ this.props.interval[0].format("DD/MM/YYYY") +
          ' to ' + this.props.interval[1].format("DD/MM/YYYY") +
            (this.props.population ? ' - ' + this.props.population.label : '') +
              (this.props.geometry ? ' - Custom' : '');

    var _t = this.context.intl.formatMessage;

    // Filter configuration
    var intervalLabel ='';
    if(this.props.interval) {
      var start = this.props.defaultFavouriteValues.interval ?
        moment(this.props.favourite.query.time.start).format('DD/MM/YYYY') : this.props.interval[0].format('DD/MM/YYYY');
      var end = this.props.defaultFavouriteValues.interval ?
        moment(this.props.favourite.query.time.end).format('DD/MM/YYYY') : this.props.interval[1].format('DD/MM/YYYY');

      intervalLabel = start + ' - ' + end;
      if (start === end) {
        intervalLabel = start;
      }
    }

    var intervalEditor = (
      <div className='col-md-3'>
        <DateRangePicker
          startDate={this.props.defaultFavouriteValues.interval ?
                      moment(this.props.favourite.query.time.start) : this.props.interval[0]}
          endDate={this.props.defaultFavouriteValues.interval ?
                      moment(this.props.favourite.query.time.end) : this.props.interval[1]}
          ranges={this.props.ranges}
          onEvent={_onIntervalEditorChange.bind(this)}
        >
          <div className='clearfix Select-control' style={{ cursor: 'pointer', padding: '5px 10px', width: '100%'}}>
            <span>{intervalLabel}</span>
          </div>
          </DateRangePicker>
          <span className='help-block'>Select time interval</span>
      </div>
    );

    var populationEditor = (
      <div className='col-md-3'>
        <GroupSearchTextBox
          value={this.props.defaultFavouriteValues.population ? this.props.favourite.query.population : this.props.population}
          name='groupname'
          onChange={onPopulationEditorChange.bind(this)}/>
        <span className='help-block'>Select a consumer group</span>
      </div>
    );

    var addFavouriteText;
    if(this.props.favourite){
      addFavouriteText = 'Buttons.UpdateFavourite';
    }
    else{
      addFavouriteText = 'Buttons.AddFavourite';
    }

    var favouriteEditor = (
      <div>
        <div className='col-md-3'>
          <input id='favouriteLabel' name='favouriteLabel' type='favourite' ref='favouriteLabel' autoFocus
            defaultValue ={this.props.favourite ? this.props.favourite.title : null}
            placeholder={this.props.favourite ? this.props.favourite.title : 'Label ...'}
            className='form-control' style={{ marginBottom : 15 }}/>
          <span className='help-block'>Insert a label for this favourite</span>
        </div>
        <div className='col-md-6'>
          <input  id='name' name='name' type='name' ref='name' autoFocus disabled
            placeholder={tags} className='form-control' style={{ marginBottom : 15 }}/>
          <span className='help-block'>Auto-generated Identifier</span>
        </div>
        <div className='col-md-3'>
          <Bootstrap.Button bsStyle='success' onClick={this.clickedAddFavourite} disabled={!this.props.isBeingEdited}>
            {_t({ id:addFavouriteText})}
          </Bootstrap.Button>
        </div>
      </div>
    );

    var sourceEditor = (
      <div className='col-md-3'>
        <Select name='source'
          value={this.props.defaultFavouriteValues.source ? this.props.favourite.query.source : this.props.source}
          options={[
            { value: 'METER', label: 'Meter' },
            { value: 'AMPHIRO', label: 'Amphiro B1' }
          ]}
          onChange={_onSourceEditorChange.bind(this)}
          clearable={false}
          searchable={false} className='form-group'/>
          <span className='help-block'>Select a data source</span>
        </div>
    );

    var filter = null;

    switch(this.props.editor) {
      case 'interval':
        filter = (
          <Bootstrap.ListGroupItem>
            <div className="row">
              {intervalEditor}
            </div>
          </Bootstrap.ListGroupItem>
        );
        break;

      case 'population':
        filter = (
          <Bootstrap.ListGroupItem>
            <div className="row">
              {populationEditor}
            </div>
          </Bootstrap.ListGroupItem>
        );
        break;

      case 'source':
        filter = (
            <Bootstrap.ListGroupItem>
              <div className="row">
                {sourceEditor}
              </div>
            </Bootstrap.ListGroupItem>
          );
        break;
      case 'favourite':
        filter = (
            <Bootstrap.ListGroupItem>
              <div className="row">
                {favouriteEditor}
              </div>
            </Bootstrap.ListGroupItem>
          );
        break;
    }

    // Map configuration
    var mapTitle = (
      <span>
        <i className='fa fa-map fa-fw'></i>
        <span style={{ paddingLeft: 4 }}>Map</span>
        <span style={{float: 'right',  marginTop: -3, marginLeft: 5, display : (this.props.editor ? 'block' : 'none' ) }}>
          <Bootstrap.Button bsStyle='default' className='btn-circle' onClick={_setEditor.bind(this, null)}>
            <i className='fa fa-rotate-left fa-fw'></i>
          </Bootstrap.Button>
        </span>
        <span style={{float: 'right',  marginTop: -3, marginLeft: 5}}>
          <Bootstrap.Button bsStyle='default' className='btn-circle' onClick={_setEditor.bind(this, 'source')}>
            <i className='fa fa-database fa-fw'></i>
          </Bootstrap.Button>
        </span>
        <span style={{float: 'right',  marginTop: -3, marginLeft: 5}}>
        <Bootstrap.Button bsStyle='default' className='btn-circle' onClick={_setEditor.bind(this, 'spatial')} disabled>
            <i className='fa fa-map fa-fw'></i>
          </Bootstrap.Button>
        </span>
        <span style={{float: 'right',  marginTop: -3, marginLeft: 5}}>
        <Bootstrap.Button bsStyle='default' className='btn-circle' onClick={_setEditor.bind(this, 'population')}>
            <i className='fa fa-group fa-fw'></i>
          </Bootstrap.Button>
        </span>
        <span style={{float: 'right',  marginTop: -3, marginLeft: 5}}>
        <Bootstrap.Button bsStyle='default' className='btn-circle' onClick={_setEditor.bind(this, 'interval')}>
            <i className='fa fa-calendar fa-fw'></i>
          </Bootstrap.Button>
        </span>
        <span style={{float: 'right',  marginTop: -3, marginLeft: 5}}>
        <Bootstrap.Button bsStyle='default' className='btn-circle' onClick={_setEditor.bind(this, 'favourite')}>
            <i className={'fa fa-' + favouriteIcon + ' fa-fw'}></i>
          </Bootstrap.Button>
        </span>
      </span>
    );

    var chartData = {
      series: []
    };

    if(this.props.chart.series) {
      if(this.props.chart.series.meters) {
        chartData.series.push({
          legend: 'Meter',
          xAxis: 'date',
          yAxis: 'volume',
          data: this.props.chart.series.meters.data
        });
      }

      if(this.props.chart.series.devices) {
        chartData.series.push({
          legend: 'Amphiro B1',
          xAxis: 'date',
          yAxis: 'volume',
          data: this.props.chart.series.devices.data
        });
      }
    }

    var chartFilterTags = [], map, mapFilterTags = [];

    chartFilterTags.push(
      <FilterTag key='time' text={intervalLabel} icon='calendar' />
    );
    chartFilterTags.push(
      <FilterTag key='source' text='Meter, Amphiro B1' icon='database' />
    );

    mapFilterTags.push(
      <FilterTag key='time' text={intervalLabel} icon='calendar' />
    );
    mapFilterTags.push(
      <FilterTag key='population' text={ this.props.population ? this.props.population.label : 'All' } icon='group' />
    );
    mapFilterTags.push(
      <FilterTag key='spatial' text={ this.props.geometry ? 'Custom' : 'Alicante' } icon='map' />
    );
    mapFilterTags.push(
      <FilterTag key='source' text={ this.props.defaultFavouriteValues.source ? this.props.favourite.query.source : this.props.source} icon='database' />
    );

    map = (
      <Bootstrap.ListGroup fill>
        {filter}
        <Bootstrap.ListGroupItem>
          <Map
            center={[38.36, -0.479]}
            zoom={13}
            style={{ width: '100%', height: 600 }}
            info='topright'
            >
            <LayersControl position='topright'> 
              <TileLayer />
              
              <DrawControl
                onFeatureChange={_onFeatureChange.bind(this)}
              />

              <InfoControl position='bottomleft'> 
                <Choropleth
                  name='Areas'
                  data={this.props.map.features}
                  legend='bottomright'
                  valueProperty='value'
                  scale={['white', 'red']}
                  limits={[ this.props.map.timeline ? this.props.map.timeline.min : 0, this.props.map.timeline ? this.props.map.timeline.max : 1000 ]}
                  steps={6}
                  mode='e'
                  infoContent={feature => feature ? <div><h5>{feature.properties.label}</h5><span>{feature.properties.value}</span></div> : <div><h5>Hover over an area...</h5></div>}
                  highlightStyle={{ weight: 3 }}
                  onClick={(map, layer) => map.fitBounds(layer.getBounds()) }
                  style={{
                    fillColor: "#ffff00",
                    color: "#000",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.5
                  }}
                />
              </InfoControl>
              <GeoJSON
                name='Meters'
                data={this.props.metersLocations}
                popupContent={feature => <div><h5>Serial:</h5><h5>{feature.properties.serial}</h5></div>}
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
            </LayersControl>
          </Map>
        </Bootstrap.ListGroupItem>
        <Bootstrap.ListGroupItem>
          <Timeline   onChange={_onChangeTimeline.bind(this)}
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
          <Link className='pull-right' to='/' style={{ paddingLeft : 7, paddingTop: 12 }}>View dashboard</Link>
        </Bootstrap.ListGroupItem>
      </Bootstrap.ListGroup>
    );

    var mapPanel = (
      <Bootstrap.Panel header={mapTitle}>
        {map}
      </Bootstrap.Panel>
    );

    return (
      <div className='container-fluid' style={{ paddingTop: 10 }}>
        <div className='row'>
          <div className='col-md-12'>
            <Breadcrumb routes={this.props.routes}/>
          </div>
        </div>
        <div className='row'>
          <div className='col-md-12'>
            {mapPanel}
          </div>
        </div>
      </div>
    );
    }
});

AnalyticsMap.icon = 'map';
AnalyticsMap.title = 'Section.Map';

function mapStateToProps(state) {
  return {
      source: state.map.source,
      geometry: state.map.geometry,
      population: state.map.population,
      interval: state.map.interval,
      editor: state.map.editor,
      ranges: state.map.ranges,
      map: state.map.map,
      chart: state.map.chart,
      profile: state.session.profile,
      routing: state.routing,
      favourite: state.favourites.selectedFavourite,
      isBeingEdited: state.map.isBeingEdited,
      filtersChanged: state.map.filterChanged,
      defaultFavouriteValues : state.map.defaultFavouriteValues,
      metersLocations: state.map.metersLocations
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions : bindActionCreators(Object.assign({}, { getTimeline, getFeatures, getChart,
                                                     setEditor, setEditorValue, setTimezone,
                                                     addFavourite, updateFavourite, setEditorValuesBatch, getMetersLocations}) , dispatch)
  };
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(AnalyticsMap);
