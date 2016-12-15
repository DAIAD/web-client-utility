var React = require('react');
var bs = require('react-bootstrap');
var CheckboxGroup = require('react-checkbox-group');
var DisplayParams = require('../../DisplayParams');

var WhoItem = React.createClass({
  getInitialState: function() {
    return {
      showModal: false,
      selectedCluster: Array.isArray(this.props.clusters) && this.props.clusters[0] ? this.props.clusters[0] : null,
      selectedGroups: Array.isArray(this.props.value) ? this.props.value : []
    };
  },
  componentWillReceiveProps: function(nextProps) {
    if (Array.isArray(nextProps.clusters) && nextProps.clusters[0]) {
      this.setState({ selectedCluster: nextProps.clusters[0] });
    }
    if (nextProps.value) {
      this.setState({ selectedGroups: Array.isArray(nextProps.value) ? nextProps.value : [] });
    }
  },
  render: function() {
    const { clusters, setValue, value, noAll, intl, id } = this.props;
    const { selectedCluster, selectedGroups } = this.state;
    const _t = x => intl.formatMessage({ id: x });

    const allLabel = _t('Buttons.All');
    const noneLabel = _t('Buttons.None');

    if (!clusters) return null;
    const allGroups = clusters.map(cluster => cluster.groups).reduce((p, c) => [...p, ...c], []);

    const selectedParams = clusters.map(cluster => {
      const selectedClusterGroups = selectedGroups.filter(group => group.clusterKey === cluster.key);
      return {
        key: selectedClusterGroups.length > 0 ? cluster.name : null,
        value: selectedClusterGroups.map(g => g.name)
      };
    });

    const displayGroups = selectedGroups.map(group => ({ 
      ...group, 
      value: group.key, 
      label: clusters.find(cluster => cluster.key === group.clusterKey).name + ': ' + group.name
    }));

    return (
      <div>
        <bs.Col md={4}>
          <bs.ButtonGroup vertical block>
            { !noAll ? 
              <bs.Button bsSize='large' bsStyle={value.value === 'all' ? 'primary' : 'default'} style={{marginBottom: 10}} onClick={() => { setValue({value:'all', label: allLabel}); }}>{allLabel}</bs.Button>
              : 
                <div />
            }
            <bs.Button bsSize='large' bsStyle={Array.isArray(value) ? 'primary' : 'default'}  style={{marginBottom: 10}} onClick={() => this.setState({showModal: true})}>{_t('Wizard.common.choose')}</bs.Button>
          </bs.ButtonGroup>
        </bs.Col>
        <bs.Col md={7}>
          <DisplayParams 
            params={selectedParams}
            limit={40}
            style={{ width: '80%' }}
          /> 
        </bs.Col>
        
        <bs.Modal
          show={this.state.showModal}
          animation={false}
          bsSize='large'
          backdrop='static'
          onHide={() => this.setState({showModal: false})}
          >
          <bs.Modal.Header closeButton>
            <h4>{_t(`Wizard.items.${id}.modal`)}</h4>
          </bs.Modal.Header>
          <bs.Modal.Body>
            
            <bs.Row>
              <bs.Tabs position='top' tabWidth={20} activeKey={selectedCluster.key} onSelect={(val) => this.setState({ selectedCluster: clusters.find(cluster => cluster.key === val) })}>
                {
                  clusters.map((cluster, idx) => (
                    <bs.Tab key={idx} eventKey={cluster.key} title={cluster.name} />
                    ))
                }
              </bs.Tabs>
            </bs.Row>
            
            <bs.Row style={{ marginTop: 15 }}>
              <bs.Col md={4}>
                <CheckboxGroup name='select-groups' value={selectedGroups.map(group => group.key)} onChange={newValues =>  this.setState({ selectedGroups: newValues.map(key => allGroups.find(group => group.key === key))  })}>
                {
                  Checkbox => 
                  <ul style={{listStyle: 'none'}}>
                    {
                      selectedCluster.groups  
                      .map((group, idx) => (
                        <li key={idx}><label><Checkbox value={group.key}/> {group.name} </label></li>
                      ))
                    }
                  </ul>
                }
                </CheckboxGroup>
              </bs.Col>
            
                <bs.Col md={6}>
                  <DisplayParams 
                    params={selectedParams}
                    limit={40}
                    style={{ width: '80%' }}
                  />
              </bs.Col>

              <bs.Col xs={3} md={2}>
                <bs.Button bsStyle='primary' style={{ marginRight: 5 }} onClick={() => { this.setState({ selectedGroups: [...selectedGroups.filter(group => group.clusterKey !== selectedCluster.key), ...selectedCluster.groups] }); }}>{allLabel}</bs.Button>
                <bs.Button bsStyle='default' onClick={() => { this.setState({ selectedGroups: selectedGroups.filter(group => group.clusterKey !== selectedCluster.key) }); }}>{noneLabel}</bs.Button>
              </bs.Col>
            </bs.Row>

          </bs.Modal.Body>
          <bs.Modal.Footer>
            <bs.Button onClick={() => { setValue(displayGroups);  this.setState({showModal: false}); }}>OK</bs.Button>
            <bs.Button onClick={() => this.setState({showModal: false})}>{_t('Buttons.Cancel')}</bs.Button>
          </bs.Modal.Footer>
        </bs.Modal>
      </div>
    );
  }
});

module.exports = WhoItem; 
