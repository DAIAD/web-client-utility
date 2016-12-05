var React = require('react');
var bs = require('react-bootstrap');
var Select = require('react-select');
var moment = require('moment');
var DatetimeInput = require('react-datetime');
var CheckboxGroup = require('react-checkbox-group');

var { Map, TileLayer, GeoJSON  } = require('react-leaflet-wrapper');


var SetNameItem = React.createClass({
  validate: function() {
    const value = this.props.getValue() ? this.props.getValue().value : null;
    if (!value) {
      throw 'A name must be selected for scenario';
    }
  },
  render: function() {
    const { getValue, setValue, id } = this.props;
    const value = getValue() ? getValue().value : null;
    return (
      <div>
        <bs.Input type="text" placeholder='Enter scenario name' value={value} onChange={(e) => setValue(id, {value: e.target.value, label: e.target.value })}/>
      </div>
    );
  }
});

var WhoItem = React.createClass({
  getInitialState: function() {
    return {
      showModal: false,
      validationFail: false,
      selectedCluster: null,
      selectedGroups: Array.isArray(this.props.getValue()) ? this.props.getValue() : []
      //who: this.props.who 
    };
  },
  componentWillReceiveProps: function(nextProps) {
    if (nextProps.clusters) {
      this.setState({ selectedCluster: Array.isArray(nextProps.clusters) && nextProps.clusters[0] ? nextProps.clusters[0].value : null });
    }
  },
  validate: function() {
    const { getValue } = this.props;
    const value = getValue();

    if (Array.isArray(value)) {
      if (value.length < 1) {
        throw 'Who not set';
      }
    }
    else if (!value || !value.value || value.value != 'all') {
      throw 'Who not set';
    }
  },
  render: function() {
    const { groups, clusters, setValue, id } = this.props;
    //const who = getValue();
    const { selectedCluster, selectedGroups } = this.state;
    return (
      <div>
        <bs.ButtonGroup vertical block>
          <bs.Button bsStyle='primary' style={{marginBottom: 10}} onClick={() => { setValue(id, {value:'all', label: 'All'}); }}>All</bs.Button>
          <bs.Button style={{marginBottom: 10}} onClick={() => this.setState({showModal: true})}>Custom</bs.Button>
        </bs.ButtonGroup>
        
        <bs.Modal
          show={this.state.showModal}
          animation={false}
          bsSize='large'
          onHide={() => this.setState({showModal: false})}
          >
          <bs.Modal.Header closeButton>
            Custom user selection
          </bs.Modal.Header>
          <bs.Modal.Body>
            <GroupsSelect
              clusters={clusters}
              groups={groups}
              selectedCluster={selectedCluster}
              selectedGroups={selectedGroups}
              onClusterSelect={(val) => { this.setState({ selectedCluster: val }); }}
              onGroupsSelect={(values) => { this.setState({ selectedGroups: values }); }}
            />
          </bs.Modal.Body>
          <bs.Modal.Footer>
            <bs.Button onClick={() => { setValue(id, selectedGroups);  this.setState({showModal: false}); }}>OK</bs.Button>
            <bs.Button onClick={() => this.setState({showModal: false})}>Cancel</bs.Button>
          </bs.Modal.Footer>
        </bs.Modal>
      </div>
    );
  }
});

function GroupsSelect (props) {
  const { selectedCluster, selectedGroups, onGroupsSelect, onClusterSelect, clusters, groups } = props;
  return (
    <bs.Grid>
      <bs.Row>
        <bs.Col xs={3} md={3}>
          Cluster
        </bs.Col>
        <bs.Col xs={3} md={3}>
          Group
        </bs.Col>
        <bs.Col xs={3} md={4}>
          Selected
        </bs.Col>
      </bs.Row>
      <br/>
      <bs.Row>
        <bs.Col xs={6} md={2}>
          <bs.Tabs position='left' tabWidth={20} activeKey={selectedCluster} onSelect={(val) => onClusterSelect(val)}>
            {
              clusters.map((cluster, idx) => (
                <bs.Tab key={idx} eventKey={cluster.value} title={cluster.label} />
                ))
            }
          </bs.Tabs>
        </bs.Col>

        <bs.Col xs={6} md={3}>
          <CheckboxGroup name='select-groups' value={selectedGroups.map(group => group.value)} onChange={(newValues => {  onGroupsSelect(groups.filter(group => newValues.includes(group.value))); })}>
            {
              Checkbox => 
              <ul style={{listStyle: 'none'}}>
                {
                  groups
                  .filter(group => group.cluster === selectedCluster) 
                  .map((group, idx) => (
                    <li key={idx}><label><Checkbox value={group.value}/> {group.label} </label></li>
                  ))
                }
              </ul>
            }
          </CheckboxGroup>
        </bs.Col>
        <bs.Col xs={6} md={4}>
          <Select
            disabled={true}
            className='select-hide-arrow'
            name='user-select'
            multi={true}
            options={groups}
            value={selectedGroups.map(x => x.value)}
          />
        </bs.Col>
      </bs.Row>
    </bs.Grid>
  );
} 

var WhereItem = React.createClass({
  getInitialState: function() {
    return {
      showModal: false,
      validationFail: false,
      selectedCluster: 'area',
      selectedGroups: Array.isArray(this.props.getValue()) ? this.props.getValue() : []
      //who: this.props.who 
    };
  },
  componentWillReceiveProps: function(nextProps) {
    if (nextProps.clusters) {
      this.setState({ selectedCluster: Array.isArray(nextProps.clusters) && nextProps.clusters[0] ? nextProps.clusters[0].value : null });
    }
  },
  validate: function() {
    const { getValue } = this.props;
    const value = getValue();
    if (Array.isArray(value)) {
      if (value.length < 1) {
        throw 'Where not set';
      }
    }
    else {
      if (!value || !value.value || value.value != 'all'){
        throw 'Where not set';
      }
    }
  },
  render: function() {
    const { setValue, clusters, groups, id } = this.props;
    //const where = getValue();
    const { selectedCluster, selectedGroups } = this.state;
    return (
      <div>
        <bs.ButtonGroup vertical block>
          <bs.Button bsStyle='primary' style={{marginBottom: 10}} onClick={() => setValue(id, {value:'all', label: 'All'})}>All</bs.Button>
          <bs.Button style={{marginBottom: 10}} onClick={() => this.setState({showModal: true})}>Custom</bs.Button>

        </bs.ButtonGroup>
          <bs.Modal
          show={this.state.showModal}
          bsSize='large'
          animation={false}
          onHide={() => this.setState({showModal: false})}
          >
          <bs.Modal.Header closeButton>
            Custom area selection
          </bs.Modal.Header>
          <bs.Modal.Body>
 
            <GroupsSelect
              clusters={clusters}
              groups={groups}
              selectedCluster={selectedCluster}
              selectedGroups={selectedGroups}
              onClusterSelect={(val) => { this.setState({ selectedCluster: val }); }}
              onGroupsSelect={(values) => { this.setState({ selectedGroups: values }); }}
            />
 
            <Map
              style={{ width: '100%', height: 300}}
              center={[38.35, -0.48]} 
              zoom={13}
              >
              <TileLayer />
            </Map>

            
          </bs.Modal.Body>
          <bs.Modal.Footer>
            <bs.Button onClick={() => { setValue(id, selectedGroups);  this.setState({showModal: false})} }>OK</bs.Button>
            <bs.Button onClick={() => this.setState({showModal: false})}>Cancel</bs.Button>
          </bs.Modal.Footer>
        </bs.Modal> 
        </div>
    );
  }
});

var WhenItem = React.createClass({
  getInitialState: function() {
    return {       
      showModal: false,
      timespan: this.props.getValue() || this.getLastYear(),
      validationFail: false,
      error: ''
    };
  },
  validate: function() {
    const when = this.props.getValue() ? this.props.getValue().timespan : null;
    if (!when) {
      throw 'When not set';
    }
    else if (when.length < 2 || when.length > 2) {
      throw 'When not set';
    }
    else if (isNaN(Date.parse(new Date(when[0])))) {
      throw 'From date not valid';
    }
    else if (isNaN(Date.parse(new Date(when[1])))) {
      throw 'To date not valid';
    }
    else if (when[0] > when[1]) {
      throw 'From date after To date';
    }
  },
  getLastYear: function() {
    return [moment().subtract(1, 'year').startOf('year').valueOf(), moment().subtract(1, 'year').endOf('year').valueOf()];
  },
  render: function() {
    const { setValue, id } = this.props;
    //const when = getValue();
    //const { error } = this.state;
    return (
      <div>
        <bs.ButtonGroup vertical block>
            <bs.Button bsStyle='primary' style={{marginBottom: 10}} onClick={() => setValue(id, {timespan: this.getLastYear(), value:'lastYear', label: 'Last year'} )}>Last year</bs.Button>
          <bs.Button style={{marginBottom: 10}} onClick={() => this.setState({showModal: true})}>Custom</bs.Button>
        </bs.ButtonGroup>
        <bs.Modal
          show={this.state.showModal}
          animation={false}
          onHide={() => this.setState({showModal: false})}
          > 
          <bs.Modal.Header closeButton>
            Custom range selection
          </bs.Modal.Header>
          <bs.Modal.Body>          
            {
              (() => {
                var { timespan } = this.state;
                const [t0, t1] = timespan;

                const datetimeProps = {
                  closeOnSelect: true,
                  dateFormat: 'ddd D MMM[,] YYYY',
                  timeFormat: null, 
                  inputProps: {size: 10}, 
                };

                return (
                  <div className="form-group">
                    <label className="control-label">Date Range:</label>
                    <div>
                      <DatetimeInput {...datetimeProps} 
                        value={t0} 
                        onChange={(val) => (this.setState({ timespan: [val, t1] }))} 
                       />
                      &nbsp;-&nbsp;
                      <DatetimeInput {...datetimeProps} 
                        value={t1}
                        onChange={(val) => (this.setState({ timespan: [t0, val] }))} 
                       />
                      <p className="help text-muted">{'Specify the time range you are interested into.'}</p>
                    </div>
                  </div>
                  );
              })()
            }
          </bs.Modal.Body>
          <bs.Modal.Footer>
            <bs.Button onClick={() => { setValue(id, {timespan: this.state.timespan, value: 'custom', label: `${moment(this.state.timespan[0]).format('DD/MM/YYYY')}-${moment(this.state.timespan[1]).format('DD/MM/YYYY')}` });   this.setState({showModal: false})} }>OK</bs.Button>
            <bs.Button onClick={() => this.setState({showModal: false})}>Cancel</bs.Button>
          </bs.Modal.Footer>
        </bs.Modal> 
      </div>
    );
  }
});

var DistributionItem = React.createClass({
  getInitialState: function() {
    return {       
      showModal: false,
    };
  },
  validate: function() {
    const distribution = this.props.getValue() ? this.props.getValue().value : null;
    
    if (!distribution) {
      throw 'A method must be selected';
    }
    else if (distribution != 'equally' && distribution != 'fairly'){
      throw 'Select between equally or fairly';
    }
    
  },
  render: function() {
    const { setValue, id } = this.props;
    return (
      <div>
        <bs.ButtonGroup vertical block>
            <bs.Button bsStyle='primary' style={{marginBottom: 10}} onClick={() => setValue(id, {value: 'equally', label: 'Equally'})}>Equally</bs.Button>
            <bs.Button bsStyle='success' style={{marginBottom: 10}} onClick={() => setValue(id, {value: 'fairly', label: 'Fairly'})}>Fairly</bs.Button>
        </bs.ButtonGroup>
      </div>
    );
  }
});

var SetGoalItem = React.createClass({
  validate: function() {
    const { getValue } = this.props;
    const value = getValue() ? getValue().value : null; 
    if (isNaN(value)) {
      throw 'Goal needs to be a number';
    }
    else if (value >= 0) {
      throw 'Goal needs to be negative';
    }
  },
  render: function() {
    const { getValue, setValue, id } = this.props;
    const goal = getValue() ? getValue().value : null; 
    return (
      <div>
        <bs.Input type="text" placeholder='Enter goal percentage' value={goal} onChange={(e) => setValue(id, {value: e.target.value, label: e.target.value + ' %'})}/>
      </div>
    );
  }
});

var SelectSavingsPotentialItem = React.createClass({
  validate: function() {
    const { getValue } = this.props;
    const value = getValue() ? getValue().value : null;
    if (!value) {
      throw 'A predefined scenario must be selected';
    }
  },
  render: function() {
    const { getValue, setValue, items, id } = this.props;
    const value = getValue(); 
    const scenarios = items.filter(scenario => scenario.completedOn != null).map(scenario => ({ label: scenario.name + ' ('+scenario.parameters +')', value: scenario.id, parameters: scenario.parameters }));
    return (
      <div>
        <Select
          name='scenario-select'
          multi={false}
          options={scenarios}
          value={value}
          onChange={(val) => setValue(id, val) }
        />
      </div>
    );
  }
});

var SetSavingsPercentageItem = React.createClass({
  validate: function() {
    const { getValue } = this.props;
    const value = getValue() ? getValue().value : null;
    if (value <= 0 || value > 100) {
      throw 'Savings expectation needs to be between 0 and 100';
    }
  },
  render: function() {
    const { getValue, setValue, id } = this.props;
    const value = getValue() ? getValue().value : null;
    return (
      <div>
        <bs.Input type="text" placeholder='Enter savings percentage' value={value} onChange={(e) => setValue(id, {value: e.target.value, label: e.target.value + ' %'} )}/>
      </div>
    );
  }
});

var SelectBudgetType = React.createClass({
  validate: function() {
    const { getValue } = this.props;
    const value = getValue() ? getValue().value : null;
    if (!value) {
      throw 'A budget type must be selected';
    }
  },
  render: function() {
    const { setValue, id } = this.props;
    //const value = getValue() ? getValue().value : null;
    return (
      <div>
        <bs.Button bsStyle='primary' bsSize='large' style={{marginBottom: 10}} onClick={() => { setValue(id, {value: 'savings', label: 'Savings'}); }} block>Savings scenario</bs.Button>
        <bs.Button bsStyle='success' bsSize='large' style={{marginBottom: 10}} onClick={() => { setValue(id, {value:'estimate', label:'Estimate'}); }} block>Estimate budget</bs.Button>
      </div>
    );
  }
});

module.exports = {
  SetNameItem,
  WhoItem,
  WhereItem,
  WhenItem,
  DistributionItem,
  SetGoalItem,
  SelectSavingsPotentialItem,
  SetSavingsPercentageItem,
  SelectBudgetType
}; 
