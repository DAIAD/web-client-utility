var React = require('react');
var Select = require('react-select').default;
var { bindActionCreators } = require('redux');
var { connect } = require('react-redux');
var moment = require('moment');
var Timeline = require('../../Timeline');

var { FormattedTime } = require('react-intl');

var Bootstrap = require('react-bootstrap');
var Dropzone = require('react-dropzone');

var { submitQuery } = require('../../../actions/QueryActions');
var { createUser, createAmphiro, generateAmphiroData, setTimezone, setErrors, getFeatures } = require('../../../actions/DebugActions');
var { getMetersLocations } = require('../../../actions/MapActions');

var { Map, TileLayer, GeoJSON, Choropleth } = require('react-leaflet-wrapper');

var onChangeTimezone = function (val) {
  this.props.actions.setTimezone(val.value);
};

var _getTimelineValues = function (timeline) {
  if (timeline) {
    return timeline.getTimestamps();
  }
  return [];
};

var _getTimelineLabels = function (timeline) {
  if (timeline) {
    return timeline.getTimestamps().map(function (timestamp) {
      return (
        <FormattedTime value={new Date(timestamp)}
          day='numeric'
          month='numeric'
          year='numeric' />
      );
    });
  }
  return [];
};

var Development = React.createClass({
  contextTypes: {
    intl: React.PropTypes.object
  },

  getInitialState() {
    return {
      isLoading: null
    };
  },

  _resolveMapCenter: function () {
    const center = this.props.profile.utility.center;
    return (center ? center.coordinates.reverse() : [38.36, -0.479]);
  },

  createUser: function (e) {
    if (this.refs.password.value) {
      this.props.actions.createUser(this.refs.password.value);
    }
  },

  createAmphiro: function (e) {
    this.props.actions.createAmphiro();
  },

  clearErrors: function () {
    this.props.actions.setErrors(null);
  },

  executeQuery: function (e) {
    var groupSpatialFilter = {
      type: 'GROUP',
      group: 'd29f8cb8-7df6-4d57-8c99-0a155cc394c5'
    };

    var query = {
      time: {
        type: 'SLIDING',
        start: moment().valueOf(),
        duration: -60,
        durationTimeUnit: 'DAY',
        granularity: 'DAY'
      },
      population: [
          /*
           * { type :'USER', label: 'User 1', users:
           * ['63078a88-f75a-4c5e-8d75-b4472ba456bb'] }, { type :'CLUSTER',
           * label: 'Income', // cluster:
           * 'bd1a6ad7-6419-44a1-b951-bf6f1a4200d5', // name: 'Income',
           * clusterType: 'INCOME' },
           */ {
          type: 'UTILITY',
          label: 'Alicante',
          utility: '2b48083d-6f05-488f-9f9b-99607a93c6c3'
        }/*
             * , { type :'UTILITY', label: 'Alicante (top 2)', utility:
             * '2b48083d-6f05-488f-9f9b-99607a93c6c3', ranking: { type: 'TOP',
             * metric: 'SUM', field: 'VOLUME', limit: 2 } }
             */
      ],
      // spatial :[constraintSpatialFilter],
      spatial: [groupSpatialFilter],
      // source: 'BOTH',
      source: 'METER',
      metrics: ['SUM']
    };

    this.props.actions.submitQuery({ query: query });
  },

  onDropAmphiroData: function (files) {
    if (this.props.debug.isLoading) {
      return;
    }

    this.props.actions.generateAmphiroData(this.props.debug.timezone, files);
  },

  componentWillMount: function () {
    //fetch meter geojson data
    if (!this.props.metersLocations) {
      this.props.actions.getMetersLocations();
    }

  },

  componentDidMount: function () {
    var timezone = 'UTC';
    if ((this.props.profile) && (this.props.profile.timezone)) {
      timezone = this.props.profile.timezone;
    }

    this.props.actions.setTimezone(timezone);
  },

  render: function () {
    var spinner = (<i className='fa fa-cloud-upload fa-4x'></i>);
    if (this.props.debug.isLoading === true) {
      spinner = (<i className='fa fa-cog fa-spin fa-4x'></i>);
    }

    var modal = null;
    if ((this.props.debug.errors) && (this.props.debug.errors.length > 0)) {
      var errors = [];
      for (var i = 0; i < this.props.debug.errors.length; i++) {
        errors.push(<p key={i}>{this.props.debug.errors[i].description}</p>);
      }

      modal = (
        <Bootstrap.Modal show={true} onHide={this.clearErrors}>
          <Bootstrap.Modal.Header closeButton>
            <Bootstrap.Modal.Title>Error</Bootstrap.Modal.Title>
          </Bootstrap.Modal.Header>
          <Bootstrap.Modal.Body>
            {errors}
          </Bootstrap.Modal.Body>
          <Bootstrap.Modal.Footer>
            <Bootstrap.Button onClick={this.clearErrors}>Close</Bootstrap.Button>
          </Bootstrap.Modal.Footer>
        </Bootstrap.Modal>
      );
    }

    // Add map
    var onChangeTimeline = function (value, label, index) {
      this.props.actions.getFeatures(this.props.query.timeline, value, 'Alicante');
    };

    var map = (
      <Bootstrap.ListGroupItem>
        <Map
          height={400}
          width='100%'
          center={this._resolveMapCenter()}
          zoom={13}
        >
          <TileLayer />
          <Choropleth
            name='Areas'
            data={this.props.debug.features}
            legend='bottomright'
            valueProperty='value'
            scale={['white', 'red']}
            steps={4}
            mode='e'
            popupContent={feature => <div><h5>{feature.properties.label}</h5><span>{feature.properties.value}</span></div>}
            highlightStyle={{ weight: 4 }}
            style={{
              fillColor: "#ffff00",
              color: "#000",
              weight: 3,
              opacity: 1,
              fillOpacity: 0.5
            }}
          />
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
        </Map>
      </Bootstrap.ListGroupItem>
    );

    var timeline = (
      <Bootstrap.ListGroupItem>
        <Timeline onChange={onChangeTimeline.bind(this)}
          labels={_getTimelineLabels(this.props.query.timeline)}
          values={_getTimelineValues(this.props.query.timeline)}
          defaultIndex={0}
          speed={1000}
          animate={false}>
        </Timeline>
      </Bootstrap.ListGroupItem>
    );

    // End of map
    return (
      <div className='container-fluid' style={{ paddingTop: 10 }}>
        {modal}
        <div className='row' style={{ marginBottom: 10 }}>
          <div className='col-md-6'>
            <Bootstrap.Panel header='Automatically register users and Amphiro devices'>
              <Bootstrap.ListGroup fill>
                <Bootstrap.ListGroupItem>
                  <div className='row'>
                    <div className='form-group col-md-3'>
                      <label className='control-label' htmlFor='password'>Default Password</label>
                    </div>
                    <div className='col-md-9'>
                      <input id='password' name='password' type='password' ref='password' autoFocus
                        placeholder='Password ...' className='form-control' style={{ marginBottom: 15 }} />
                      <span className='help-block'>Default password for new accounts</span>
                    </div>
                  </div>
                  <div className='row'>
                    <div className='col-md-6'>
                      <Bootstrap.Button bsStyle='primary' onClick={this.createUser}>Register users</Bootstrap.Button>
                    </div>
                  </div>
                </Bootstrap.ListGroupItem>
                <Bootstrap.ListGroupItem>
                  <div className='row'>
                    <div className='col-md-6'>
                      <Bootstrap.Button bsStyle='primary' onClick={this.createAmphiro}>Create Amphiro</Bootstrap.Button>
                    </div>
                  </div>
                </Bootstrap.ListGroupItem>
                <Bootstrap.ListGroupItem>
                  <div className='row'>
                    <div className='col-md-6'>
                      <Bootstrap.Button bsStyle='primary' onClick={this.executeQuery}>Execute Query</Bootstrap.Button>
                    </div>
                  </div>
                </Bootstrap.ListGroupItem>
                <Bootstrap.ListGroupItem>
                  <span style={{ fontWeight: 'bold' }}>Register users</span>
                  <span color='#565656'>: Registers all users found in the white list for the utility of the signed administrator. A default password is required for the registration.</span>
                  <br /><br />
                  <span style={{ fontWeight: 'bold' }}>Create Amphiro</span>
                  <span color='#565656'>: Registers at least one Amphiro device for every registered user for the utility of the signed administrator.</span>
                </Bootstrap.ListGroupItem>
                {map}
                {timeline}
              </Bootstrap.ListGroup>
            </Bootstrap.Panel>
          </div>
          <div className='col-md-6'>
            <Bootstrap.Panel header='Upload random Amphiro data'>
              <Bootstrap.ListGroup fill>
                <Bootstrap.ListGroupItem>
                  <div className='row'>
                    <div className='form-group col-md-3'>
                      <label className='control-label' htmlFor='timezone'>Time zone</label>
                    </div>
                    <div className='col-md-9'>
                      <Select name='timezone'
                        value={this.props.debug.timezone}
                        options={[
                          { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
                          { value: 'Europe/Madrid', label: 'Madrid' },
                          { value: 'Europe/Athens', label: 'Athens' }
                        ]}
                        onChange={onChangeTimezone.bind(this)}
                        clearable={false}
                      />
                      <span className='help-block'>Select time zone of the uploaded data</span>
                    </div>
                  </div>
                  <div className='row'>
                    <div className='form-group col-md-12'>
                      <Dropzone onDrop={this.onDropAmphiroData.bind(this)} disableClick={true} multiple={true}
                        style={{ textAlign: 'center', fontSize: '3em', color: '#656565', border: '1px dotted #656565' }}>
                        {spinner}
                      </Dropzone>
                    </div>
                  </div>
                </Bootstrap.ListGroupItem>
                <Bootstrap.ListGroupItem>
                  <span color='#565656'>Drop a text file with Amphiro sessions. Data will be generated for the current month.</span>
                  <br />
                  <span color='#565656'>Only devices with no sessions will be updated.</span>
                </Bootstrap.ListGroupItem>
              </Bootstrap.ListGroup>
            </Bootstrap.Panel>
          </div>
        </div>
      </div>
    );
  }
});

Development.icon = 'bug';
Development.title = 'Section.Support.Development';

function mapStateToProps(state) {
  return {
    query: state.query,
    debug: state.debug,
    profile: state.session.profile,
    routing: state.routing,
    metersLocations: state.map.metersLocations
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(Object.assign({}, {
      submitQuery, createUser, createAmphiro,
      setTimezone, setErrors, generateAmphiroData, getFeatures, getMetersLocations
    }), dispatch)
  };
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(Development);
