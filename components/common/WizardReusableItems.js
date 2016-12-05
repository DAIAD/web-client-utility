var React = require('react');
var bs = require('react-bootstrap');
var Select = require('react-select');
var moment = require('moment');
var DatetimeInput = require('react-datetime');
var CheckboxGroup = require('react-checkbox-group');

var { Map, TileLayer, GeoJSON, InfoControl } = require('react-leaflet-wrapper');


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
    const all = intl.formatMessage({ id: 'Wizard.common.all' });

    return (
      <div>
        <bs.Col md={4}>
          <bs.ButtonGroup vertical block>
            { !noAll ? 
              <bs.Button bsStyle={value.value === 'all' ? 'primary' : 'default'} style={{marginBottom: 10}} onClick={() => { setValue({value:'all', label: all}); }}>{all}</bs.Button>
              : 
                <div />
            }
            <bs.Button bsStyle={Array.isArray(value) ? 'primary' : 'default'}  style={{marginBottom: 10}} onClick={() => this.setState({showModal: true})}>{intl.formatMessage({ id: 'Wizard.common.choose' })}</bs.Button>
          </bs.ButtonGroup>
        </bs.Col>
        <bs.Col md={7}>
          {
            Array.isArray(value) ?
              <Select
                disabled={true}
                className='select-hide-arrow'
                name='user-select'
                multi={true}
                options={groups}
                value={selectedGroups.map(x => x.value)}
              />
              :
                <div />
          }
        </bs.Col>
        
        <bs.Modal
          show={this.state.showModal}
          animation={false}
          bsSize='large'
          backdrop='static'
          onHide={() => this.setState({showModal: false})}
          >
          <bs.Modal.Header closeButton>
            <h4>Custom user selection</h4>
          </bs.Modal.Header>
          <bs.Modal.Body>
            
            <bs.Row>
              <bs.Tabs position='top' tabWidth={20} activeKey={selectedCluster} onSelect={(val) => this.setState({ selectedCluster: val })}>
                {
                  clusters.map((cluster, idx) => (
                    <bs.Tab key={idx} eventKey={cluster.value} title={cluster.label} />
                    ))
                }
              </bs.Tabs>
            </bs.Row>
            
            <bs.Row style={{ marginTop: 30 }}>
              <bs.Col md={4}>
                <CheckboxGroup name='select-groups' value={selectedGroups.map(group => group.value)} onChange={newValues => this.setState({ selectedGroups: groups.filter(group => newValues.includes(group.value)) })}>
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
            
              <bs.Col xs={3} md={8}>
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
    const { setValue, clusters, value, noAll, id, intl, geojson } = this.props;
    const groups = geojson.features ? 
      geojson.features.map(f => ({ 
        cluster: f.properties.cluster, 
        label: f.properties.label, 
        value: f.properties.label 
      }))
        : 
          [];
    const { selectedCluster, selectedGroups } = this.state;
    return (
      <div>
        <bs.ButtonGroup vertical block>
          <bs.Button bsStyle='primary' style={{marginBottom: 10}} onClick={() => setValue(id, {value:'all', label: 'All'})}>All</bs.Button>
          <bs.Button style={{marginBottom: 10}} onClick={() => this.setState({showModal: true})}>Custom</bs.Button>

        <bs.Col md={4}>
          <bs.ButtonGroup vertical block>
            { !noAll ? 
              <bs.Button bsStyle={value.value === 'all' ? 'primary' : 'default'} style={{marginBottom: 10}} onClick={() => setValue({value:'all', label: all})}>{all}</bs.Button>
              :
                <div />
            }
            <bs.Button bsStyle={Array.isArray(value) ? 'primary' : 'default'} style={{marginBottom: 10}} onClick={() => this.setState({showModal: true})}>{intl.formatMessage({ id: 'Wizard.common.choose'})}</bs.Button>

          </bs.ButtonGroup>
        </bs.Col>
        <bs.Col md={7}>
          {
            Array.isArray(value) ?
              <Select
                disabled={true}
                className='select-hide-arrow'
                name='user-select'
                multi={true}
                options={groups}
                value={selectedGroups.map(x => x.value)}
              />
              :
                <div />
          }
        </bs.Col>
        
        <bs.Modal
          show={this.state.showModal}
          bsSize='large'
          backdrop='static'
          animation={false}
          onHide={() => this.setState({showModal: false})}
          >
          <bs.Modal.Header closeButton>
            <h4>Custom area selection</h4>
          </bs.Modal.Header>
          <bs.Modal.Body>

            <bs.Row>
              <bs.Tabs position='top' tabWidth={20} activeKey={selectedCluster} onSelect={(val) =>  this.setState({ selectedCluster: val })}>
                {
                  clusters.map((cluster, idx) => (
                    <bs.Tab key={idx} eventKey={cluster.value} title={cluster.label} />
                    ))
                }
              </bs.Tabs>
            </bs.Row>
            <bs.Row>
              <Map
                style={{ width: '100%', height: 500 }}
                center={[38.35, -0.48]} 
                zoom={12.55}
                >
                <TileLayer />

                <InfoControl position='topright'> 
                <GeoJSON
                  data={geojson}
                  infoContent={feature => feature ? <div><h5>{feature.properties.label}</h5><span>{feature.properties.value}</span></div> : <div><h5>Hover over an area...</h5></div>}
                  onClick={(map, layer, feature) => { 
                    if (this.state.selectedGroups.map(g => g.value).includes(feature.properties.label)) {
                      this.setState({ selectedGroups: this.state.selectedGroups.filter(group => group.label !== feature.properties.label) });
                    }
                    else {
                      this.setState({ selectedGroups: [...this.state.selectedGroups, ({ cluster: feature.properties.cluster, label: feature.properties.label, value: feature.properties.label })] });
                    }
                  }}

                  style={feature => this.state.selectedGroups.map(g => g.value).includes(feature.properties.label) ? ({
                    fillColor: "#ff0000",
                    color: "#000",
                    weight: 3,
                    opacity: 1,
                    fillOpacity: 0.5
                  }) : ({
                    fillColor: "#fff",
                    color: "#000",
                    weight: 3,
                    opacity: 1,
                    fillOpacity: 0.5
                  })}
                  highlightStyle={{ weight: 4 }}
                />
              </InfoControl>
              </Map>
            </bs.Row>
                
            <div style={{ margin: 20 }}>
              <Select
                disabled={true}
                className='select-hide-arrow'
                name='user-select'
                multi={true}
                options={groups}
                value={selectedGroups.map(x => x.value)}
              />
            </div>

          </bs.Modal.Body>
          <bs.Modal.Footer>
            <bs.ButtonGroup style={{ float: 'left' }}>
            <bs.Button bsStyle='default' onClick={() => { this.setState({ selectedGroups: groups }); }}>All</bs.Button>
            <bs.Button bsStyle='default' onClick={() => { this.setState({ selectedGroups: [] }); }}>None</bs.Button>
          </bs.ButtonGroup>

            <bs.Button onClick={() => { setValue(selectedGroups);  this.setState({showModal: false})} }>OK</bs.Button>
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
        <bs.Col md={4}>
          <bs.ButtonGroup vertical block>
              <bs.Button bsStyle={value.value === 'lastYear' ? 'primary' : 'default'} style={{marginBottom: 10}} onClick={() => setValue({timespan: this.getLastYear(), value:'lastYear', label: last} )}>{last}</bs.Button>
            <bs.Button bsStyle={value.value === 'custom' ? 'primary' : 'default'} style={{marginBottom: 10}} onClick={() => this.setState({showModal: true})}>{choose}</bs.Button>
          </bs.ButtonGroup>
        </bs.Col>

        <bs.Modal
          show={this.state.showModal}
          animation={false}
          backdrop='static'
          onHide={() => this.setState({showModal: false})}
          > 
          <bs.Modal.Header closeButton>
            <h4>Custom range selection</h4>
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


function DistributionItem (props) {
  const { value, setValue, intl } = props;
  const distributionItems = [
    {value: 'equally', label: intl.formatMessage({ id: 'Wizard.items.distribution.options.equally.value' })},
    {value: 'fairly', label: intl.formatMessage({ id: 'Wizard.items.distribution.options.fairly.value' })}
  ];

  return (
    <bs.Col md={5}>
      <bs.ButtonGroup vertical block>
      {
        distributionItems.map(item => 
          <bs.Button 
            key={item.value}
            bsStyle={item.value === value.value ? 'primary' : 'default'} 
            style={{marginBottom: 10}} 
            onClick={() => setValue(item)}
            >
            <FormattedMessage id={`Wizard.items.distribution.options.${item.value}.label`} />
        </bs.Button>
        )
      }
      </bs.ButtonGroup>
    </bs.Col>
  );
}

function SetGoalItem (props) {
  const { value, setValue } = props;
  return (
    <bs.Col md={5}>
      <span style={{ float: 'left', fontSize: '3em', height: '100%', marginRight: 10 }}>-</span>
      <bs.Input 
        type="number" 
        min='0'
        max='100'
        step='0.01'
        value={parseFloat(value.value).toFixed(2)} 
        bsSize="large" 
        style={{ float: 'left', width: '60%', height: '100%', fontSize: '2.8em' }} 
        onChange={(e) => setValue({value: e.target.value, label: '-' + e.target.value + ' %'})}
      />
      <span style={{ float: 'left', marginLeft: 10, fontSize: '2.2em' }}>%</span>
    </bs.Col>
  );
}

function SelectSavingsScenario (props) {
  const { value, setValue, items } = props;
  const scenarios = items.filter(scenario => scenario.completedOn != null)
  .map(scenario => {
    //const paramsShort = util.getFriendlyParams(scenario.parameters, 'short')
    //    .map(x => `${x.key}: ${x.value}`).join(', ');
    return { 
      label: scenario.name, 
      value: scenario.id, 
      parameters: scenario.parameters 
    };
    });
  return (
    <bs.Col md={5}>
      <Select
        bsSize="large"
        name='scenario-select'
        multi={false}
        options={scenarios}
        value={value}
        onChange={(val) => val != null ? setValue(val) : setValue({}) }
      />
    </bs.Col>
  );
}

function SetSavingsPercentageItem (props) {
  const { value, setValue } = props;
  return (
    <div>
      <bs.Col md={5}>
        <bs.Input 
          type='number'
          min='0'
          max='100'
          step='0.01'
          value={parseFloat(value.value).toFixed(2)} 
          bsSize='large'
          style={{ float: 'left', width: '60%', height: '100%', fontSize: '2.8em' }} 
          onChange={(e) => setValue({value: e.target.value, label: e.target.value + ' %'})}
        />
      </bs.Col>
    </div>
    );
}

function SelectBudgetType (props) {
  const { value, setValue, intl } = props;
  const budgetTypes = [
    {value: 'scenario', label: intl.formatMessage({ id: 'Wizard.items.budgetType.options.scenario.value' })}, 
    {value: 'estimate', label: intl.formatMessage({ id: 'Wizard.items.budgetType.options.estimate.value' })}
  ];
  return (
    <bs.Col md={4}>
      {
        budgetTypes.map(budget =>  
          <bs.Button 
            key={budget.value}
            bsStyle={budget.value === value.value ? 'primary' : 'default'} 
            bsSize='large' 
            style={{marginBottom: 10}} 
            onClick={() => setValue(budget)} 
            block
            >
            <FormattedMessage id={`Wizard.items.budgetType.options.${budget.value}.label`} />
          </bs.Button>
          )
      }
    </bs.Col>
  );
}

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
