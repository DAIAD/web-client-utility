var React = require('react');
var bs = require('react-bootstrap');
var moment = require('moment');
var DatetimeInput = require('react-datetime');
var { FormattedDate } = require('react-intl');


var WhenItem = React.createClass({
  getInitialState: function() {
    return {       
      showModal: false,
      timespan: this.props.initialValue.timespan ? this.props.initialValue.timespan : this.getLastYear(),
    };
  },

  getLastYear: function() {
    return [moment().subtract(1, 'year').startOf('year').valueOf(), moment().subtract(1, 'year').endOf('year').valueOf()];
  },
  render: function() {
    const { value, setValue, intl } = this.props;

    const { timespan } = this.state;

    const _t = x => intl.formatMessage({ id: x });

    const lastLabel = _t('Wizard.items.when.options.last.value');
    const chooseLabel = _t('Wizard.common.choose');

    return (
      <div>
        <bs.Col md={4}>
          <bs.ButtonGroup vertical block>
              <bs.Button bsSize='large' bsStyle={value.value === 'lastYear' ? 'primary' : 'default'} style={{marginBottom: 10}} onClick={() => setValue({timespan: this.getLastYear(), value:'lastYear', label: lastLabel} )}>{lastLabel}</bs.Button>
            <bs.Button bsSize='large' bsStyle={value.value === 'custom' ? 'primary' : 'default'} style={{marginBottom: 10}} onClick={() => this.setState({showModal: true})}>{chooseLabel}</bs.Button>
          </bs.ButtonGroup>
        </bs.Col>
        
        <bs.Col md={7} style={{ textAlign: 'left' }}>
          {
            value.value === 'custom' ?
              <div>
              <span style={{ fontSize: 16, fontWeight: 500, color: '#666' }}>{_t('Wizard.items.when.modal')}: </span>
              <b>
                <FormattedDate value={timespan[0]} /> <span>&nbsp;-&nbsp;</span> <FormattedDate value={timespan[1]} />
              </b>
            </div>
              :
                <span />
          }
        </bs.Col>


        <bs.Modal
          show={this.state.showModal}
          animation={false}
          className='confirmation-modal'
          backdrop='static'
          onHide={() => this.setState({showModal: false})}
          > 
          <bs.Modal.Header closeButton>
            <h4>{_t('Wizard.items.when.modal')}</h4>
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
                    <div>
                      <label style={{ width: '100%' }}><span>{_t('Wizard.items.when.from')}:</span>
                        <DatetimeInput {...datetimeProps} 
                          value={t0} 
                          className='date-input'
                          onChange={(val) => (this.setState({ timespan: [val, t1] }))} 
                        />
                      </label>
                      <br />
                      <label style={{ width: '100%' }}><span style={{ marginRight: 20 }}>{_t('Wizard.items.when.to')}:</span>
                      <DatetimeInput {...datetimeProps} 
                        value={t1}
                        className='date-input'
                        onChange={(val) => (this.setState({ timespan: [t0, val] }))} 
                        />
                      </label>
                      <p className="help text-muted">{_t('Wizard.items.when.help')}</p>
                    </div>
                  </div>
                  );
              })()
            }
          </bs.Modal.Body>
          <bs.Modal.Footer>
            <bs.Button onClick={() => { setValue({timespan: this.state.timespan, value: 'custom', label: `${moment(this.state.timespan[0]).format('DD/MM/YYYY')}-${moment(this.state.timespan[1]).format('DD/MM/YYYY')}` });   this.setState({showModal: false})} }>OK</bs.Button>
            <bs.Button onClick={() => this.setState({showModal: false})}>{_t('Buttons.Cancel')}</bs.Button>
          </bs.Modal.Footer>
        </bs.Modal> 
      </div>
    );
  }
});

module.exports = WhenItem; 
