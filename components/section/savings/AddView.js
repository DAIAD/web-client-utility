var React = require('react');
var bs = require('react-bootstrap');
var Modal = require('../../Modal');
var Wizard = require('../../common/Wizard');
var { SetNameItem, WhoItem, WhereItem, WhenItem } = require('../../common/WizardReusableItems');
var util = require('../../../helpers/wizard');
var { nameToId } = require('../../../helpers/common');

const initialEmpty = {};

const validateWho = (value) => {
  if ((!Array.isArray(value) && value.value !== 'all') || 
      (Array.isArray(value) && value.length === 0)) {
    throw 'noWho';
  }
};

const validateWhere = value => {
  if ((!Array.isArray(value) && value.value !== 'all') || 
     (Array.isArray(value) && value.length == 0)) {
    throw 'noWhere';
  }
};

const validateWhen = ({timespan:value}) => {
  if (!value) {
    throw 'noWhen';
  }
  else if (value.length < 2 || value.length > 2) {
    throw 'noWhen';
  }
  else if (isNaN(Date.parse(new Date(value[0])))) {
    throw 'fromInvalid';
  }
  else if (isNaN(Date.parse(new Date(value[1])))) {
    throw 'toInvalid';
  }
  else if (value[0] > value[1]) {
    throw 'fromAfterTo';
  }
  else if (value[1] > new Date().valueOf()) {
    throw 'noFuture';
  }
};

const validateName = function (value) { 
  const existing = this.props.scenarios.map(scenario => nameToId(scenario.name));
  if (!value.value) {
    throw 'noName';
  }
  else if (existing.includes(nameToId(value.value))) {
    throw 'nameExists';
  }
};

var SavingsPotentialAdd = React.createClass({
  componentWillMount: function() {
    const utility = this.props.profile.utility;
    //TODO: temp way to load areas in state
    if(!this.props.areas) {
      const population = {
          utility: utility.key,
          label: utility.name,
          type: 'UTILITY'
      };
      this.props.actions.getTimeline(population);
    }
  },
  //TODO: have to create geojson from areas object since API not ready yet
  getGeoJSON: function(areasObj) {
    if (!areasObj) return {};
    const areas = Object.keys(areasObj).map(key => areasObj[key]);
    return {
      type : 'FeatureCollection',
      features : areas.map(area => ({
        'type' : 'Feature',
        'geometry' : area.geometry,
        'properties' : {
          'label' : area.label,
          'cluster': 'area'
        }
      })),
      crs : {
        type : 'name',
        properties : {
          name : 'urn:ogc:def:crs:OGC:1.3:CRS84'
        }
      }
    };
  },
  render: function() {
    const { groups, clusters, segments, areas, actions, validationError, intl } = this.props;
    const { setValidationError, addSavingsScenario, goToListView } = actions;
    const geojson = this.getGeoJSON(areas);
    return (
      <bs.Panel header='Add Scenario'>
        <bs.Row>
        <bs.Col md={6}>
          <h4>Add new Scenario</h4> 
        </bs.Col>
        <bs.Col md={6} style={{textAlign: 'right'}}>
          <bs.Button bsStyle='success' onClick={() => { goToListView(); }}><i className='fa fa-chevron-left'></i> Back to all</bs.Button>
        </bs.Col>
      </bs.Row>
      <hr/>
        <Wizard
          onComplete={(values) => { addSavingsScenario(values); goToListView(); }}
          validateLive
          childrenProps={{ intl }}
          > 
          <WhoItem
            id='who'
            title='Who'
            description='Select all population or narrow savings potential calculation to selected groupsn'
            clusters={clusters}
            initialValue={{}}
            validate={validateWho}
          />
          <WhereItem
            id='where'
            title='Where'
            description='Select all areas or narrow savings potential calculation to selected areas'
            clusters={segments.map(segment => ({ 
              ...segment, 
              groups: geojson.features ? geojson.features.map(f => ({ 
                feature: f,
                clusterKey: f.properties.cluster, 
                name: f.properties.label, 
                key: f.properties.label 
              })) : [] 
            }))}
            initialValue={{}}
            validate={validateWhere}
          />
          <WhenItem
            id='when'
            title='Data'
            description='Data to be used for savings potential calculation, last year or custom'
            initialValue={{}}
            validate={validateWhen}
          />
          <SetNameItem
            title='Name'
            description='Select a descriptive name for your scenario'
            id='name'
            initialValue=''
            validate={validateName.bind(this)}
          />
          <div
            id='confirmation'
            initialValue={{}}
          />
        </Wizard>
      </bs.Panel>
    );
  }
});

module.exports = SavingsPotentialAdd;
