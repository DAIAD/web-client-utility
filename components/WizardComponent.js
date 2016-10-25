var React = require('react');
var bs = require('react-bootstrap');
var Select = require('react-select');

var util = require('../helpers/wizard');

var Wizard = React.createClass({ 
  
  //react lifecycle functions
  getDefaultProps: function() {
    return {
      show: true,
      showAll: false,
      showPrevious: true,
      onComplete: ((values) => {
        //console.log('values: ', values);
        alert('Job sent');
      }),
      onValidationFail: ((error) => {
        console.error('Validation error:', error);
        alert(`Validation error: ${error}`);
      }),
      onReset: () => null
    };
  },
  getInitialState: function() {
    return {
      showConfirmation: false,
      components: this.props.initialComponents || [],
      clearedIdx: 0,
      activeIdx: this.props.initialActiveIdx || 0,
      values: this.getInitialValues()
    };
  },
  componentWillReceiveProps: function(nextProps) {
    if (nextProps.initialComponents) {
      this.setState({ components: nextProps.initialComponents });
    }
  },

  //class methods
  getInitialValues: function() {
    return Array.isArray(this.props.initialComponents) ? this.props.initialComponents.reduce(((p, c) => { 
      let dict = {};
      dict[c.id] = Array.isArray(c.item.initialValue) ? c.item.initialValue : null;
      return {...p, ...dict};
    }), {}) : [];
  },
  addValues: function(id, values) {
    let dict = {};
    dict[id] = values;
    this.setState({ values: {...this.state.values, ...dict} });
  },
  hasPrevious: function() {
    return this.state.activeIdx -1 >= 0 ? true : false;
  },
  hasNext: function() {
    return this.state.activeIdx + 1 < this.props.children.length ? true : false;
  },
  activatePrevious: function() {
    this.setState({ activeIdx: this.state.activeIdx - 1 });
  },
  activateNext: function() {
    this.setState({ activeIdx: this.state.activeIdx + 1, clearedIdx: this.state.activeIdx + 1 });
  },
  activate: function(idx) {
    this.setState({ activeIdx: idx });
  },
  reset: function() {
    this.setState({
      activeIdx: this.props.initialActiveIdx || 0,
      clearedIdx: 0,
      values: this.getInitialValues()
    });
    this.props.onReset();
  },
  validateAllAndSetValues: function() {
    const children = Array.isArray(this.props.children) ? this.props.children : [this.props.children];
    return this.props.showAll ?  
      children.reduce(((p, c) => 
                      p.then(() => 
                        this.validateAndSetValues(c.props.id))), Promise.resolve())
                              :
      this.validateAndSetValues(this.props.children[this.state.activeIdx].props.id); 
  },
  validateAndSetValues: function(id) {
    
    try {
      const wizardItem = this.refs[id];
      wizardItem.props.validate ? wizardItem.props.validate(wizardItem.props.getValue() ? wizardItem.props.getValue().value : null) : wizardItem.validate();
        return Promise.resolve();
      }
      catch(err) {
        this.props.onValidationFail(err);
        return Promise.reject(err);
      };
  },
  showConfirmation: function() {
    this.setState({ showConfirmation: true });
  },
   
  render: function() {
    const { showPrevious, showAll, show, children } = this.props;
    const { activeIdx, clearedIdx } = this.state;
    
    const activeComponent = this.props.children[activeIdx];
    const values = this.state.values;
    const elements = React.Children.map(children, component => React.cloneElement(component, {ref:component.props.id, getValue:() => values[component.props.id], setValue: this.addValues, values}));
    if (!show) return <div/>;
    return (
      <div className='wizard'>
        {
          React.Children.map(elements, ((component, i) => ( 
              <WizardItem 
                key={component.props.id} 
                idx={i}
                title={component.props.title}
                description={component.props.description}
                value={values[component.props.id] || [{}]}
                active={activeIdx === i}
                showAll={showAll}
                activateMe={() => { this.activate(i); }}
                clearedIdx={clearedIdx}
                cleared={clearedIdx>i}
                >
                {
                  component
                }
              </WizardItem>
              )))
        }
        <div className='wizard-controls'>
          <bs.ButtonGroup style={{width: '100%'}}>
            {
              showPrevious ? 
                <bs.Button 
                  style={{float: 'left'}}
                  disabled={this.hasPrevious() ? false : true} 
                  onClick={() => {
                    this.activatePrevious();
                  }} >
                  Previous
                </bs.Button>
                :
                  <div/>
            }
            <bs.Button 
             bsStyle='warning'
             style={{float: 'left', marginLeft: 10}}
             onClick={() => {
              this.reset();
             }}><i className='fa fa-undo'></i>  Reset
           </bs.Button>
           {
             this.hasNext() && !showAll ?
               (
                 <bs.Button 
                   style={{float: 'right'}}
                   onClick={() => {
                    this.validateAndSetValues(activeComponent.props.id)
                    .then(() => {
                      this.activateNext();
                    }, (err) => null);
                   }} >
                   Next
                  </bs.Button>
                ) : (
                <bs.Button 
                  bsStyle='primary' 
                  style={{float: 'right'}}
                  onClick={() => {
                    this.validateAllAndSetValues()
                    .then(() => {
                      this.showConfirmation()
                    }, (err) => null);
                  }}><i className='fa fa-calculator'></i>  Calculate
                </bs.Button>
              )
         }
       </bs.ButtonGroup>
       </div> 
       <bs.Modal
          show={this.state.showConfirmation}
          animation={false}
          onHide={() => this.setState({showConfirmation: false})}
          >
          <bs.Modal.Header closeButton>
            Confirmation
          </bs.Modal.Header>
          <bs.Modal.Body>
            Sending this job will take a while to run. Are you confident with the options you selected?
            <div style={{fontFamily: 'monospace', margin: 20}}>
              <ul>
                {
                  util.getFriendlyParams(this.state.values).map(value =>
                    <li>
                      <b>{value.key}: </b> <span>{value.value}</span>
                    </li>
                  )
                }
              </ul>
            </div>
          </bs.Modal.Body>
          <bs.Modal.Footer>
            <bs.Button onClick={() => { this.props.onComplete(this.state.values); this.setState({showConfirmation: false})} }>Yes</bs.Button>
            <bs.Button onClick={() => this.setState({showConfirmation: false})}>No</bs.Button>
          </bs.Modal.Footer>
        </bs.Modal>

      </div>
    );
  }
});


function WizardItem (props) {
  const { id, idx, active, title, description, item, value, activateMe, clearedIdx, cleared, showAll, children } = props;
  const labels = Array.isArray(value) ? value.map(x => x.label || '-') : (value.label ? [value.label] : ['-']);
  const activeLink = clearedIdx >= idx ? true : false;
  return (
    <div className='wizard-item' style={{ margin: '20px 0' }}>
      <bs.Row>
        {
        <bs.Col md={1}>
          <h4>{idx+1}.</h4>
          </bs.Col>
        }
        <bs.Col md={3} className='wizard-item-title'>
          <bs.OverlayTrigger placement='bottom' overlay={<bs.Tooltip id='tooltip'>{description || '-'}</bs.Tooltip>}>
            <span 
              block 
              style={{marginBottom: 20, backgroundColor: '#337ab7', lineHeight: 1.33, borderRadius: 6, border: '1px solid #2e6da4', fontWeight: 400, fontSize: 18, width: '100%', height: 70, color: '#fff', display: 'block', textAlign: 'center', paddingTop: 20 }} 
              bsStyle={cleared ? 'primary' : 'primary'} 
              bsSize='large' 
              onClick={() => activeLink ? activateMe() : null} 
              disabled={active ? false : true} 
            >
              {title}
            </span>
          </bs.OverlayTrigger>
        </bs.Col>
        <bs.Col md={4} className='wizard-item-select'>
        {
          active || showAll ? 
          children  
            : 
              <div />
        }
      </bs.Col>
      <bs.Col md={4} className='wizard-item-view'>
        <Select
          disabled={true}
          placeholder='-'
          name='user-select'
          className='select-hide-arrow'
          multi={Array.isArray(value) ? true : false}
          options={Array.isArray(value) ? value : [value]}
          value={Array.isArray(value) ? value.map(x=>x.value) : value.value}
        />
      </bs.Col>
    </bs.Row>
  </div>
  );
};

module.exports = Wizard;
 
