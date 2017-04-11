var React = require('react');
var bs = require('react-bootstrap');
var Modal = require('../../Modal');
var Wizard = require('../../common/Wizard');
var { SetNameItem, WhoItem, WhereItem, WhenItem } = require('../../common/WizardReusableItems');

const validateWho = (value) => {
  if ((!Array.isArray(value) && value.value !== 'all') || 
     (Array.isArray(value) && value.length == 0)) {
    throw 'noWho';
  }
};

const validateWhere = (value) => {
  if ((!Array.isArray(value) && value.value !== 'all') ||
     (Array.isArray(value) && value.length == 0)) {
       throw 'noWhere';
  }
};

const validateWhen = (value) => {
  if (!value || !value.startDate || !value.endDate) {
    throw 'noWhen';
  }
  else if (isNaN(Date.parse(new Date(value.startDate)))) {
    throw 'fromInvalid';
  }
  else if (isNaN(Date.parse(new Date(value.endDate)))) {
    throw 'toInvalid';
  }
  else if (value.startDate > value.endDate)  {
    throw 'fromAfterTo';
  }
  else if (value.endDate > new Date().valueOf()) {
    throw 'noFuture';
  }
};

const validateName = function ({value}) { 
  const existing = this.props.budgets.map(budget => budget.name);

  if (!value) {
    throw 'noName';
  }
  else if (existing.includes(value)) {
    throw 'nameExists';
  }
};
function ValidationError (props) {
  const { validationError, setValidationError } = props;
  if (validationError == null) {
    return <div/>;
  }
  const reset = () => setValidationError(null);
  return (
    <Modal
        title='Validation Error'
        show={true}
        text={validationError}
        onClose={reset}
        actions={[
          {
            name: 'OK',
            action: reset,
          }]}
      />
  );
}

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
      <div>
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
          > 
          <WhoItem
            id='who'
            title='Who'
            description='Select all population or narrow savings potential calculation to selected groupsn'
            groups={groups}
            clusters={clusters}
            initialValue={{}}
            validate={validateWho}
            intl={intl}
          />
          <WhereItem
            id='where'
            title='Where'
            description='Select all areas or narrow savings potential calculation to selected areas'
            clusters={segments}
            geojson={geojson}
            initialValue={{}}
            validate={validateWhere}
            intl={intl}
          />
          <WhenItem
            id='when'
            title='Data'
            description='Data to be used for savings potential calculation, last year or custom'
            initialValue={{}}
            validate={validateWhen}
            intl={intl}
          />
          <SetNameItem
            title='Name'
            description='Select a descriptive name for your scenario'
            id='name'
            initialValue=''
            validate={validateName.bind(this)}
            intl={intl}
          />
          <div
            id='confirmation'
            initialValue={{}}
          />
        </Wizard>

    </div>
    );
  }
});

module.exports = SavingsPotentialAdd;
