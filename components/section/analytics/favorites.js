var React = require('react');
var sprintf = require('sprintf');
var Bootstrap = require('react-bootstrap');
var Modal = require('../../Modal');
var Timeline = require('../../Timeline');
var Table = require('../../Table');
var {FormattedTime} = require('react-intl');
var { Link } = require('react-router');
var { bindActionCreators } = require('redux');
var { connect } = require('react-redux');

var { Map, TileLayer, GeoJSON, Choropleth, LayersControl, InfoControl } = require('react-leaflet-wrapper');

var Chart = require('../../reports-measurements/chart');
var {configPropType} = require('../../../prop-types');
var population = require('../../../model/population');

var { setTimezone, fetchFavouriteQueries, openFavourite,
      closeFavourite, setActiveFavourite,
      addCopy, deleteFavourite, openWarning,
      closeWarning, resetMapState, getFavouriteMap,
      getFavouriteChart, getFavouriteForecast, getFeatures, 
      getProfileLayout, pinToDashboard, unpin } = require('../../../actions/FavouritesActions');
      
var { getMetersLocations } = require('../../../actions/MapActions');

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

var Favourites = React.createClass({
   contextTypes: {
     intl: React.PropTypes.object,
    config: configPropType,
    router: function() { return React.PropTypes.func.isRequired; },
    //using this instead of  router: React.PropTypes.func due to warning
    //https://github.com/react-bootstrap/react-router-bootstrap/issues/91
   },
   
   getInitialState() {
     return {
       expanded: null,
     };
  },
  
  componentWillMount : function() {
    this.props.actions.resetMapState();
    this.props.actions.fetchFavouriteQueries();
    this.props.actions.getProfileLayout();
    // ??
    //this.setState({points : createPoints()});
  
    if (!this.props.metersLocations) {
      this.props.actions.getMetersLocations();
    }

   },

  componentDidMount : function() {
    var utility = this.props.profile.utility;
    this.props.actions.setTimezone(utility.timezone);
   },
  componentWillUnmount : function() {
    //TODO - in case we want the 'Map' section to display the default view of the map,
    //even when there is an active favourite open in the favourite's section, we should de-activate the favourite
    //when unmounting, based on the cause of the unmount.
    //Keep the favourite active only after the clickedEditFavourite action.
  },

  clickedOpenFavourite(favourite) {
    var profile = this.props.profile;
    favourite.timezone = profile.utility.timezone;
    this.props.actions.closeFavourite();
    
    switch(favourite.type) {
      case 'MAP':
        this.props.actions.getFavouriteMap(favourite);
      break;
      case 'CHART':
        this.props.actions.getFavouriteChart(favourite);
      break;
      case 'FORECAST':
        var groupType = favourite.queries[0].population[0].type;
        var population1;
        if(groupType === 'UTILITY'){
          this.props.actions.getFavouriteForecast(null, profile.utility.key, profile.utility.name, profile.timezone);
        } else if(groupType === 'GROUP'){
          var [g, r] =  population.fromString(favourite.queries[0].population[0].label);
          if(!g.clusterKey){
            population1 = [{group: g.key, label:"GROUP:" + g.key + '/' + favourite.title, type:"GROUP"}];
            this.props.actions.getFavouriteForecast(population1, profile.utility.key, profile.utility.name, profile.timezone);
          } else {
            population1 = [{group: g.key, label:"CLUSTER:" + g.clusterKey + ":" + g.key, type:"GROUP"}]; 
            this.props.actions.getFavouriteForecast(population1, profile.utility.key, profile.utility.name, profile.timezone);
          }
        } else if (groupType === 'USER'){
          console.error('Single user forecast favourite not supported. ', favourite.queries[0].population[0]);
        }
        break;
      default:
        console.error(sprintf('Favourite type (%s) not supported.', favourite.type));
        break;
    }
    
    this.props.actions.openFavourite(favourite);
  },

  editFavourite(favourite) {
    this.props.actions.setActiveFavourite(favourite);
    switch (favourite.type) {
      case 'MAP':
        this.context.router.push('/analytics/map');
        break;
      case 'CHART':
        this.context.router.push('/analytics/panel');
        break;
      default:
        console.warn('Favourite type [' + favourite.type + '] is not supported.');
        break;
    }
  },

  duplicateFavourite(namedQuery) {
    var request =  {
      'namedQuery' : namedQuery
    };
    namedQuery.title = namedQuery.title + ' (copy)';
    this.props.actions.addCopy(request);
    this.props.actions.fetchFavouriteQueries();
  },

  clickedDeleteFavourite(namedQuery) {
    var request =  {
      'namedQuery' : namedQuery
    };
    this.props.actions.openWarning(request);
  },
  
  pinToDashboard(namedQuery) {
    var request =  {
      'namedQuery' : namedQuery
    };    
    this.props.actions.pinToDashboard(request);
  },
  
  unpin : function(fav, e) {
    var request =  {
      'namedQuery' : fav
    };
    this.props.actions.unpin(request);
  },
  
  onLinkClick () {
    //todo - consider keeping or discarding favourite
  },
  
  render: function() {
    var icon = 'list';
    var self = this;

      const dashboardLinkFooter = (
         <Bootstrap.ListGroupItem>
             <span style={{ paddingLeft : 7}}> </span>
                <Link to='/' style={{ paddingLeft : 7, float: 'right'}}>View Dashboard</Link>
           </Bootstrap.ListGroupItem>
       );

      const configTitle = (
          <span>
             <i className={'fa fa-' + icon + ' fa-fw'}></i>
             <span style={{ paddingLeft: 4 }}>{'Favourite Selection'}</span>
          </span>
       );

    var title, dataContent, footerContent, toggleTitle, togglePanel;

    var defaults= {
      chartProps: {
        width: 780,
        height: 300,
      }
    };


   if(this.props.selectedFavourite){
     const timelineMin = this.props.map.timeline && this.props.map.timeline.min || 0;
     const timelineMax = this.props.map.timeline && this.props.map.timeline.max || 0;
     switch(this.props.selectedFavourite.type) {
       case 'MAP':
           title = 'Map: ' + this.props.selectedFavourite.title;
           dataContent = (
              <Bootstrap.ListGroupItem>
                <Map
                  center={[38.36, -0.479]}
                  zoom={13}
                  width='100%'
                  height={600}
                  info='topright'
                  >
                  <LayersControl position='topright'> 
                    <TileLayer  />
                    <InfoControl position='bottomleft'> 
                      <Choropleth
                        name='Areas'
                        data={this.props.map.features}
                        legend={timelineMax === 0 ? null : 'bottomright'}
                        valueProperty='value'
                        scale={['white', 'red']}
                        limits={[timelineMin, timelineMax]}
                        steps={6}
                        mode='e'
                        infoContent={feature => feature && feature.properties ? 
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
               <Timeline   onChange={_onChangeTimeline.bind(this)}
                           labels={ _getTimelineLabels(this.props.map.timeline) }
                           values={ _getTimelineValues(this.props.map.timeline) }
                           defaultIndex={this.props.map.index}
                           speed={1000}
                           animate={false}>
               </Timeline>
            </Bootstrap.ListGroupItem>
           );

             footerContent = (
                <Bootstrap.ListGroupItem>
                   <span style={{ paddingLeft : 7}}> </span>
                   <Link 
                     to='/analytics/map' 
                     style={{ paddingLeft : 7, float: 'right'}}
                     onClick={this.onLinkClick}
                     >View Maps</Link>
                  <span style={{ paddingLeft : 7}}> </span>
                   <Link to='/' style={{ paddingLeft : 7, float: 'right'}}>View Dashboard</Link>
                </Bootstrap.ListGroupItem>
             );
           break;
       case 'CHART':
         var overlap, overlapping;
         if(this.props.selectedFavourite.overlap){
           overlap = {value:this.props.selectedFavourite.overlap, label: this.props.selectedFavourite.overlap};
           overlapping = true;
         } else {
           overlap = null;
           overlapping = false;
         }

         title = 'Chart: ' + this.props.selectedFavourite.title;
         dataContent = (
             <Bootstrap.ListGroup fill>
               <Bootstrap.ListGroupItem className="report-chart-wrapper">
                 <Chart
                   {...defaults.chartProps}
                   draw={this.props.draw}
                   field={this.props.selectedFavourite.field}
                   level={this.props.selectedFavourite.level}
                   reportName={this.props.selectedFavourite.reportName}
                   finished={this.props.finished}
                   series={this.props.data}
                   context={this.props.config}
                   overlap={overlap}
                   overlapping={overlapping}
                 />
              </Bootstrap.ListGroupItem>
            </Bootstrap.ListGroup>
         );

         footerContent = (
           <Bootstrap.ListGroupItem>
             <span style={{ paddingLeft : 7}}> </span>
             <Link 
               to='/analytics/panel' 
               style={{ paddingLeft : 7, float: 'right'}} 
               onClick={this.onLinkClick} 
               >View Charts</Link>
             <span style={{ paddingLeft : 7}}> </span>
             <Link to='/' style={{ paddingLeft : 7, float: 'right'}}>View Dashboard</Link>
           </Bootstrap.ListGroupItem>
         );

         break;
       case 'FORECAST':
         var forecastObject = null;
         var groupType = this.props.selectedFavourite.queries[0].population[0].type;
         if(groupType === 'UTILITY'){
           forecastObject = null;
         } else if(groupType === 'GROUP'){
           var [g, r] =  population.fromString(this.props.selectedFavourite.queries[0].population[0].label);
           if(!g.clusterKey){
             forecastObject = {group: g.key, label:this.props.selectedFavourite.title, type:"GROUP"};
           } else {
             forecastObject = {group: g.key, label:"CLUSTER:" + g.clusterKey + ":" + g.key, type:"GROUP"};
           }
        } 

        title = 'Chart: ' + this.props.selectedFavourite.title;
           dataContent = (
             <Bootstrap.ListGroup fill>
               <Bootstrap.ListGroupItem className="report-chart-wrapper">
                 <Chart
                   {...defaults.chartProps}
                   draw={this.props.draw}
                   field={this.props.selectedFavourite.field}
                   level={this.props.selectedFavourite.level}
                   reportName={this.props.selectedFavourite.reportName}
                   finished={this.props.finished}
                   series={this.props.data}
                   context={this.props.config}
                   forecast={forecastObject}
                 />
              </Bootstrap.ListGroupItem>
            </Bootstrap.ListGroup>
         );

         footerContent = (
           <Bootstrap.ListGroupItem>
             <span style={{ paddingLeft : 7}}> </span>
               <Link 
                 to='/analytics/panel' 
                 style={{ paddingLeft : 7, float: 'right'}} 
                 onClick={this.onLinkClick} 
                 >View Charts</Link>
               <span style={{ paddingLeft : 7}}> </span>
             <Link to='/' style={{ paddingLeft : 7, float: 'right'}}>View Dashboard</Link>
           </Bootstrap.ListGroupItem>
         );
         break;
       default:
         title = this.props.selectedFavourite.type;
     }

     toggleTitle = (
        <span>
             <span>
               <i className={'fa fa-' + icon + ' fa-fw'}></i>
               <span style={{ paddingLeft: 4 }}>{title}</span>
             </span>
             <span style={{float: 'right',  marginTop: -3, marginLeft: 5 }}>
                <Bootstrap.Button  bsStyle='default' className='btn-circle' onClick={this.props.actions.closeFavourite}>
                   <i className='fa fa-remove fa-fw'></i>
                </Bootstrap.Button>
             </span>
       </span>
     );

     togglePanel = (
       <Bootstrap.Panel expanded={this.state.expanded} onSelect={this.toggleExpanded} header={toggleTitle}>
             <Bootstrap.ListGroup fill>
           {dataContent}
           {footerContent}
               </Bootstrap.ListGroup>
           </Bootstrap.Panel>
     );

   } else{

     var infoText = (<span>Click a favourite to view ...</span>);
     togglePanel =   (
       <Bootstrap.Panel >
         <Bootstrap.ListGroup fill>
           <Bootstrap.ListGroupItem>
             {infoText}
             {dashboardLinkFooter}
           </Bootstrap.ListGroupItem>
         </Bootstrap.ListGroup>
       </Bootstrap.Panel>
     );
   }

   const favsFields = [{
       name: 'id',
       hidden: true
    }, {
       name: 'title',
       title: 'Label'
    }, {
       name: 'tags',
       title: 'Tags'
    }, {
       name: 'createdOn',
       title: 'Date',
       type: 'datetime'
    }, 
    {
       name: 'pin',
       title: 'Pinned',
       type:'action',
       icon: function(field, row) {
         return (row.pinned === false ? 'square-o' : 'check-square-o');
       },
       hidden: false,
       handler: function(field, row) {
         if(row.pinned){
           self.unpin(row);
         } else {
           self.pinToDashboard(row);
         }
       }
    },    
  {
       name: 'view',
       type:'action',
       icon: 'eye',
       handler: function(field, row) {
         self.clickedOpenFavourite(row);
       }
    }, {
       name: 'edit',
       type:'action',
       icon: function(field, row) {
             return (row.type === 'FORECAST' ? null : 'pencil'); //forecast edit action disabled
       },
       hidden: false,
       handler: function(field, row) {
         self.editFavourite(row);
       }
    }, {
       name: 'copy',
       type:'action',
       icon: 'copy',
       handler: function(field, row) {
         self.duplicateFavourite(row);
       }
    }, 
    /* {
       name: 'link',
       type:'action',
       icon: 'link',
       handler: function() {
       }
       }, */
    {
       name: 'remove',
       type:'action',
       icon: 'remove',
       handler: function(field, row) {
         self.clickedDeleteFavourite(row);
       }
    }];
    
    const favsData = this.props.favourites || [];

    const favsPager = {
       index: 0,
       size: 5,
       count: this.props.favourites ? this.props.favourites.length : 0
    };

     var favouriteContent = (
       <div style={{ padding: 10}}>
         <Table 
           fields={favsFields}
           data={favsData}
           pager={favsPager}
           template={{empty : (<span>No favorites found.</span>)}}
         />
         </div>
     );

    if(this.props.showDeleteMessage){
      var warning = 'Delete Favourite?';
         var actions = [{
              action: this.props.actions.closeWarning,
              name: "Cancel"
           }, {
              action: this.props.actions.deleteFavourite,
              name: "Delete",
              style: 'danger'
           }];

      return (
           <div className='container-fluid' style={{ paddingTop: 10 }}>
              <div className='row'>
                 <div className='col-lg-12'>
                    <Bootstrap.Panel header={configTitle}>
                       <Bootstrap.ListGroup fill>
                  {favouriteContent}
                       </Bootstrap.ListGroup>
                    </Bootstrap.Panel>
                {togglePanel}
                 </div>
             </div>
            <Modal show = {this.props.showDeleteMessage}
            onClose = {this.props.actions.closeWarning}
            title = {warning}
            text = {'You are about to delete the favourite with label "' +
              this.props.favouriteToBeDeleted.namedQuery && this.props.favouriteToBeDeleted.namedQuery.title || '' + '". Are you sure?'}
              actions = {actions}
            />
        </div>
      );
    }

   if(this.props.favourites && !this.props.isLoading){
       return (
          <div className='container-fluid' style={{ paddingTop: 10 }}>
             <div className='row'>
                <div className='col-lg-12'>
                   <Bootstrap.Panel header={configTitle}>
                      <Bootstrap.ListGroup fill>
                 {favouriteContent}
                      </Bootstrap.ListGroup>
                   </Bootstrap.Panel>
               {togglePanel}
                </div>
            </div>
      </div>
     );
   } else{
      return (
        <div>
          <img className='preloader' src='/assets/images/utility/preloader-counterclock.png' />
          <img className='preloader-inner' src='/assets/images/utility/preloader-clockwise.png' />
        </div>
      );
   }
 }
});

function mapStateToProps(state) {
  return {
    profile: state.session.profile,
    showSelected: state.favourites.showSelected,
    selectedFavourite: state.favourites.selectedFavourite,
    favourites: state.favourites.favourites,
    showDeleteMessage: state.favourites.showDeleteMessage,
    favouriteToBeDeleted: state.favourites.favouriteToBeDeleted,
    map: state.favourites.map,
    source: state.favourites.source,
    geometry: state.favourites.geometry,
    population: state.favourites.population,
    interval: state.favourites.interval,
    config: state.config,
    draw: state.favourites.draw,
    finished: state.favourites.finished,
    data: state.favourites.data,
    metersLocations: state.map.metersLocations,
    savedLayout: state.favourites.savedLayout
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions : bindActionCreators(Object.assign({}, { setTimezone, fetchFavouriteQueries,
                                                     openFavourite, closeFavourite, setActiveFavourite,
                                                     addCopy, deleteFavourite, openWarning, closeWarning,
                                                     resetMapState, getFavouriteMap, getFavouriteChart,
                                                     getFavouriteForecast, getFeatures, getProfileLayout,
                                                     pinToDashboard, unpin, getMetersLocations }) , dispatch)
  };
}

Favourites.icon = 'bar-chart';
Favourites.title = 'Section.Analytics.Fav.Title';

module.exports = connect(mapStateToProps, mapDispatchToProps)(Favourites);
