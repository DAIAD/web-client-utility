var $ = require('jquery');

var React = require('react');
var Bootstrap = require('react-bootstrap');
var { bindActionCreators } = require('redux');
var { connect } = require('react-redux');
var Table = require('../Table');
var Chart = require('../reports-measurements/chart');
var InputTextModal = require('../InputTextModal');

var { getAccounts, changeIndex, filterText, filterSerial, clearFilter, 
      getMeter, getUserChart, clearChart, setSearchModeText, setSearchModeMap, 
      setGeometry, removeFavorite, addFavorite, setSelectionMode, discardBagOfConsumers, 
      toggleConsumer, saveBagOfConsumers } = require('../../actions/UserCatalogActions');
var theme = require('../chart/themes/shine');

var { Map, TileLayer, GeoJSON, FeatureGroup, Choropleth, LayersControl, InfoControl, DrawControl } = require('react-leaflet-wrapper');
/*
var { getAccounts, changeIndex, filterText, filterSerial, clearFilter, getMeter, clearChart,
      setSearchModeText, setSearchModeMap, setGeometry,
      removeFavorite, addFavorite,
      setSelectionMode, discardBagOfConsumers, toggleConsumer, saveBagOfConsumers } = require('../../actions/UserCatalogActions');
      */

var _setSelectionMode = function(e) {
  this.props.actions.setSelectionMode(!this.props.userCatalog.selection.enabled);
};

var _show = function() {
  if(Object.keys(this.props.userCatalog.selection.selected).length > 0) {
    this.setState({ modal: true});
  }
};

var _hide = function() {
  this.setState({ modal: false});
};

var _setTitle =  function(key, text) {
  _hide.bind(this)();

  if((text) && (key==='save')) {
    _saveBagOfConsumers.bind(this)(text, Object.keys(this.props.userCatalog.selection.selected));
  }
};

var _saveBagOfConsumers = function(title, members) {
  this.props.actions.saveBagOfConsumers(title, members);
};

var _discardBagOfConsumers = function(e) {
  this.props.actions.discardBagOfConsumers();
};

var _handleKeyPress = function(e) {
  if (e.key === 'Enter') {
    this.refresh();
  }
};

var _setSearchMode = function(e) {
  if(this.props.userCatalog.search === 'map') {
    this.props.actions.setSearchModeText();
  } else {
    this.props.actions.setSearchModeMap();
  }
};

var _onFeatureChange = function(features) {
  if(!features || !features.features || !Array.isArray(features.features) || features.features.length===0){
    this.props.actions.setGeometry(null);
  } else {
    this.props.actions.setGeometry(features.features[0].geometry);
  }
};

var _clearChart = function() {
  this.props.actions.setGeometry(null);
};

var UserCatalog = React.createClass({
  contextTypes: {
      intl: React.PropTypes.object
  },

  getInitialState: function() {
    return {
      modal: false,
      draw : false
    };
  },

  componentWillMount : function() {
    if(this.props.userCatalog.accounts == null) {
      this.props.actions.getAccounts();
    }
  },

  onPageIndexChange: function(index) {
    this.props.actions.changeIndex(index);
  },

  filterText: function(e) {
    this.props.actions.filterText(this.refs.accountFilter.getValue());
  },

  filterSerial: function(e) {
    this.props.actions.filterSerial(this.refs.serialFilter.getValue());
  },

  clearFilter: function(e) {
    this.props.actions.clearFilter();
  },

  refresh: function(e) {
    this.props.actions.getAccounts();
  },

  render: function() {
    var self = this;
    var tableConfiguration = {
      fields: [{
        name: 'id',
        title: 'Id',
        hidden: true
      }, {
        name: 'email',
        title: 'User',
        link: function(row) {
          if(row.id) {
            return '/user/{id}/';
          }
          return null;
        }
      }, {
        name: 'fullname',
        title: 'Name'
      }, {
        name: 'serial',
        title: 'SWM'
      }, {
        name: 'registrationDateMils',
        title: 'Registered On',
        type: 'datetime'
      }, {
        name : 'favorite',
        type : 'action',
        icon : function(field, row) {
          return (row.favorite ? 'star' : 'star-o');
        },
        handler : (function(field, row) {
          if(row.favorite) {
            this.props.actions.removeFavorite(row.id);
          } else {
            this.props.actions.addFavorite(row.id);
          }
        }).bind(this),
        visible : (function(field, row) {
          return (row.meter !== null);
        }).bind(this)
      }, {
        name : 'chart',
        type : 'action',
        icon : 'bar-chart-o',
        handler : (function(field, row) {
          if(row.serial) {
            var profile = this.props.profile;
            this.props.actions.getUserChart(row.id, row.fullname + ' - ' + row.serial, profile.timezone);
            self.setState({draw:true});
          }
        }).bind(this),
        visible : (function(field, row) {
          return (row.meter !== null);
        }).bind(this)
      }],
      rows: this.props.userCatalog.data.accounts || [],
      pager: {
        index: this.props.userCatalog.data.index || 0,
        size: this.props.userCatalog.data.size || 10,
        count:this.props.userCatalog.data.total || 0,
        mode: Table.PAGING_SERVER_SIDE
      }
    };

    if(this.props.userCatalog.selection.enabled) {
      tableConfiguration.fields.splice(1, 0, {
        name: 'selected',
        title: '',
        type: 'alterable-boolean',
        width: 30,
        handler: (function(id, name, value) {
          this.props.actions.toggleConsumer(id);
        }).bind(this)
      });
    }

    var tableStyle = {
      row : {
        rowHeight: 50
      }
    };

    var resetButton = ( <div />);

    if((this.props.userCatalog.query.text) ||
       (this.props.userCatalog.query.serial)) {
      resetButton = (
        <div style={{float: 'right', marginLeft: 20}}>
          <Bootstrap.Button bsStyle='default' onClick={this.clearFilter}>Reset</Bootstrap.Button>
        </div>
      );
    }

    const filterOptions = (
      <Bootstrap.ListGroupItem>
        <div className="row">
          <div className="col-md-4">
            <Bootstrap.Input
              type='text'
               id='accountFilter' name='accountFilter' ref='accountFilter'
               placeholder='Account or Name  ...'
               onChange={this.filterText}
               onKeyPress={_handleKeyPress.bind(this)}
               value={this.props.userCatalog.query.text || ''} />
              <span className='help-block'>Filter by name or account</span>
          </div>
          <div className="col-md-4">
            <Bootstrap.Input
              type='text'
               id='serialFilter' name='serialFilter' ref='serialFilter'
               placeholder='SWM Serial Number  ...'
               onChange={this.filterSerial}
               onKeyPress={_handleKeyPress.bind(this)}
               value={this.props.userCatalog.query.serial || ''} />
              <span className='help-block'>Filter meter serial number</span>
          </div>
          <div className="col-md-4" style={{float: 'right'}}>
            {resetButton}
            <div style={{float: 'right'}}>
              <Bootstrap.Button bsStyle='primary' onClick={this.refresh}>Refresh</Bootstrap.Button>
            </div>
          </div>
        </div>
      </Bootstrap.ListGroupItem>
    );

    const dataNotFound = (
        <span>{ this.props.userCatalog.isLoading ? 'Loading data ...' : 'No data found.' }</span>
    );

    var filterTitle;
    if(this.props.userCatalog.selection.enabled) {
      filterTitle = (
        <span>
          <i className='fa fa-search fa-fw'></i>
          <span style={{ paddingLeft: 4 }}>Search</span>
          <span style={{float: 'right',  marginTop: 2, marginLeft: 5 }}>
            {Object.keys(this.props.userCatalog.selection.selected).length + ' selected'}
          </span>
          <span style={{float: 'right',  marginTop: -3, marginLeft: 5 }}>
            <Bootstrap.Button bsStyle='default' className='btn-circle' onClick={_discardBagOfConsumers.bind(this)} >
              <i className='fa fa-remove fa-lg' ></i>
            </Bootstrap.Button>
          </span>
          <span style={{float: 'right',  marginTop: -3, marginLeft: 5 }}>
            <Bootstrap.Button bsStyle='default' className='btn-circle' onClick={_show.bind(this)} >
              <i className='fa fa-save fa-lg' ></i>
            </Bootstrap.Button>
          </span>
        </span>
      );
    } else {
      filterTitle = (
        <span>
          <i className='fa fa-search fa-fw'></i>
          <span style={{ paddingLeft: 4 }}>Search</span>
          <span style={{float: 'right',  marginTop: -3, marginLeft: 5 }}>
            <Bootstrap.Button bsStyle='default' className='btn-circle' onClick={_setSelectionMode.bind(this)} title='Create a new group' >
              <i className='fa fa-shopping-basket fa-lg' ></i>
            </Bootstrap.Button>
          </span>
        </span>
      );
    }

    const mapTitle = (
      <span>
        <span>
          <i className="fa fa-map fa-fw"></i>
          <span style={{ paddingLeft: 4 }}>Map</span>
        </span>
        <span style={{float: 'right',  marginTop: -3, marginLeft: 5 }}>
          <Bootstrap.Button bsStyle='default' className='btn-circle' onClick={_setSearchMode.bind(this)} >
            <i className={ this.props.userCatalog.search === 'map' ? 'fa fa-undo fa-fw' : 'fa fa-pencil fa-fw' }></i>
          </Bootstrap.Button>
        </span>
      </span>
    );

    var map = (
      <Map
        width='100%'
        height={600}
        center={[38.35, -0.48]}
        zoom={13}
        >
        <TileLayer />
        { 
          this.props.userCatalog.search === 'map' ?
            <DrawControl
              onFeatureChange={_onFeatureChange.bind(this)}
            />
            : 
              <div />
          } 
          <GeoJSON
            name='Users'
            data={this.props.userCatalog.data.features}
            popupContent={feature => {
              return (
              <div>
                <h4>{feature.properties.name}</h4>
                <h5>Address: <span>{feature.properties.address}</span></h5>
                <h5>Meter id: 
                  <a 
                    href='#' 
                    onClick={(e) => { 
                      e.preventDefault();  
                      this.props.actions.getMeter(feature.properties.userKey,
                                                  feature.properties.deviceKey,
                                                  feature.properties.name
                                                 );
                    }}
                  >
                  {feature.properties.meter.serial}
                </a>
              </h5>
            </div>
            )}}
          />
      </Map>
        );
       
        var v, chartTitleText, chartConfig = null, chart = (<span>Select a meter ...</span>), data = [];

    if(Object.keys(this.props.userCatalog.charts).length) {
      chartTitleText = (
        <span>
          <span>
            <i className='fa fa-bar-chart fa-fw'></i>
            <span style={{ paddingLeft: 4 }}>Consumption - Last 30 days</span>
          </span>
          <span style={{float: 'right',  marginTop: -3, marginLeft: 5 }}>
            <Bootstrap.Button bsStyle='default' className='btn-circle' onClick={_clearChart.bind(this)} >
              <i className='fa fa-remove fa-fw' ></i>
            </Bootstrap.Button>
          </span>
        </span>
      );

      var multipleSeries = [];
      for(var key in this.props.userCatalog.charts) {
        var tempSeries = this.props.userCatalog.charts[key].series;
        if(tempSeries){
          multipleSeries.push(tempSeries);
        }
      }

      var defaults= {
        chartProps: {
          width: 780,
          height: 300,
        }
      };

      var fSeries = _.flatten(multipleSeries);

      var series = fSeries[0] ? fSeries : null;

      chart = (
        <Chart
          {...defaults.chartProps}
          draw={this.state.draw}
          field={"volume"}
          level={"day"}
          reportName={"avg"}
          finished={this.props.userCatalog.finished}
          series={series}
          context={this.props.config}
          overlap={null}
          overlapping={false}
        />
      );
    }

    return (
      <div className="container-fluid" style={{ paddingTop: 10 }}>
        <InputTextModal
          onHide={_hide.bind(this)}
          title='Create Group'
          visible={this.state.modal}
          prompt='Title ...'
          help='Set title for the new group'
          actions={
            [{ style : 'default', key : 'save', text : 'Save' },
             { style : 'danger', key : 'cancel', text : 'Cancel' }]
          }
          handler={_setTitle.bind(this)}
        />
        <div className="row">
          <div className="col-md-7">
            <Bootstrap.Panel header={filterTitle}>
              <Bootstrap.ListGroup fill>
                {filterOptions}
                <Bootstrap.ListGroupItem>
                  <Table  data={tableConfiguration}
                          onPageIndexChange={this.onPageIndexChange}
                          template={{empty : dataNotFound}}
                          style={tableStyle}
                  ></Table>
                </Bootstrap.ListGroupItem>
              </Bootstrap.ListGroup>
            </Bootstrap.Panel>
          </div>
          <div className="col-md-5">
            <Bootstrap.Panel header={mapTitle}>
              <Bootstrap.ListGroup fill>
                <Bootstrap.ListGroupItem>
                  {map}
                </Bootstrap.ListGroupItem>
              </Bootstrap.ListGroup>
            </Bootstrap.Panel>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <Bootstrap.Panel header={chartTitleText}>
              <Bootstrap.ListGroup fill>
                <Bootstrap.ListGroupItem>
                  {chart}
                </Bootstrap.ListGroupItem>
              </Bootstrap.ListGroup>
            </Bootstrap.Panel>
          </div>
        </div>
      </div>
    );
  }
});

UserCatalog.icon = 'user';
UserCatalog.title = 'Section.Users';

function mapStateToProps(state) {
  return {
      userCatalog: state.userCatalog,
      profile: state.session.profile,
      routing: state.routing,
      config: state.config
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions : bindActionCreators(
                    Object.assign({}, {
                      getAccounts, changeIndex, filterSerial, filterText, clearFilter, 
                      getMeter, getUserChart, clearChart, setSearchModeText, 
                      setSearchModeMap, setGeometry, removeFavorite, addFavorite,
                      setSelectionMode, discardBagOfConsumers, toggleConsumer, 
                      saveBagOfConsumers 
                    }), dispatch),
  };
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(UserCatalog);
