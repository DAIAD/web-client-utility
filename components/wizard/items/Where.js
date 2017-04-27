var React = require('react');
var bs = require('react-bootstrap');
var { Map, TileLayer, GeoJSON, InfoControl } = require('react-leaflet-wrapper');
var DisplayParams = require('../../DisplayParams');

var WhereItem = React.createClass({
  getInitialState: function() {
    return {
      showModal: false,
      selectedCluster: Array.isArray(this.props.clusters) && this.props.clusters[0] ? this.props.clusters[0] : null,
      selectedGroups: this.valueToGroups(this.props.value) 
    };
  },
  componentWillReceiveProps: function(nextProps) {
    if (Array.isArray(nextProps.clusters) && nextProps.clusters[0]) {
      this.setState({ selectedCluster: nextProps.clusters[0] });
    }
    //reset selected on wizard reset
    if (nextProps.value && !Array.isArray(nextProps.value) && !nextProps.value.type) {
      this.setState({ selectedGroups: [] });
    }
  },
  getValue: function(selected, label) {
    if (selected === 'all') { 
      return { selected: 'all', type: 'UTILITY', utility: this.props.utility, label };
    }
    return { type: 'AREA', area: selected, label };
  },
  getAllGroups: function() {
    return this.props.clusters
    .map(cluster => cluster.groups
         .map(group => ({ ...group, value: this.getValue(group.key, `${group.name}`) })))
    .reduce((p, c) => [...p, ...c], []);
  },
  valueToGroups: function(value) {
    return Array.isArray(value) ? 
      this.getAllGroups().filter(group => value.find(g => g.area === group.key) ? true : false)
        :
          [];
  },
  render: function() {
    const { setValue, clusters, value, noAll, intl, geojson, id } = this.props;

    const _t = x => intl.formatMessage({ id: x });
    const allLabel = _t('Buttons.All');
    const noneLabel = _t('Buttons.None');

    const { selectedCluster, selectedGroups } = this.state;

    if (!clusters) return null;
    const allGroups = this.getAllGroups();
      

    const selectedParams = clusters.map(cluster => {
      const selectedClusterGroups = selectedGroups.filter(group => group.clusterKey === cluster.key);
      return {
        key: selectedClusterGroups.length > 0 ? cluster.name : null,
        value: selectedClusterGroups.map(g => g.name)
      };
    });

    return (
      <div>
        <bs.Col md={4}>
          <bs.ButtonGroup vertical block>
            { !noAll ? 
              <bs.Button bsSize='large' bsStyle={value.selected === 'all' ? 'primary' : 'default'} style={{marginBottom: 10}} onClick={() => setValue(this.getValue('all', allLabel))}>{allLabel}</bs.Button>
              :
                <div />
            }
            <bs.Button bsSize='large' bsStyle={Array.isArray(value) ? 'primary' : 'default'} style={{marginBottom: 10}} onClick={() => this.setState({showModal: true})}>{_t('Wizard.common.choose')}</bs.Button>

          </bs.ButtonGroup>
        </bs.Col>
        <bs.Col md={7}>
          { value.selected !== 'all' ? 
          <DisplayParams
            params={selectedParams}
            limit={4}
          />
          :
            <div />
          }
        </bs.Col>
        
        <bs.Modal
          show={this.state.showModal}
          dialogClassName='map-modal'
          backdrop='static'
          animation={false}
          onHide={() => this.setState({showModal: false})}
          >
          <bs.Modal.Header closeButton>
            <h4>{_t(`Wizard.items.${id}.modal`)}</h4>
          </bs.Modal.Header>
          <bs.Modal.Body>
            <bs.Row>
              <bs.Tabs position='top' tabWidth={20} activeKey={selectedCluster.key} onSelect={(val) =>  this.setState({ selectedCluster: clusters.find(cluster => cluster.key === val) })}>
                {
                  clusters.map((cluster, idx) => (
                    <bs.Tab key={idx} eventKey={cluster.key} title={cluster.name} />
                    ))
                }
              </bs.Tabs>
            </bs.Row>
            <bs.Row>
              <bs.Col md={8}>
              <Map
                width='100%'
                height='70vh'
                center={[38.35, -0.48]} 
                zoom={12.55}
                >
                <TileLayer />

                <InfoControl position='topright'> 
                  <GeoJSON
                    data={{ type: 'FeatureCollection', features: selectedCluster.groups.map(g => g.feature)}}
                    infoContent={feature => feature ? <div><h5>{feature.properties.label}</h5><span>{feature.properties.value}</span></div> : <div><h5>Hover over an area...</h5></div>}
                    onClick={feature => { 
                      if (this.state.selectedGroups.map(g => g.key).includes(feature.properties.label)) {
                        this.setState({ selectedGroups: this.state.selectedGroups.filter(group => group.key !== feature.properties.label) });
                      }
                      else {
                        this.setState({ selectedGroups: [...this.state.selectedGroups, allGroups.find(group => group.key === feature.properties.label)] });
                      }
                    }}
                    style={feature => this.state.selectedGroups.map(g => g.key).includes(feature.properties.label) ? ({
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
            </bs.Col>
            <bs.Col md={4}>
              <div style={{ margin: 15, textAlign: 'right' }}>
                <bs.Button bsStyle='primary' style={{ marginRight: 5 }} onClick={() => { this.setState({ selectedGroups: [...selectedGroups.filter(group => group.clusterKey !== selectedCluster.key), ...allGroups.filter(group => group.clusterKey === selectedCluster.key)] }); }}>{allLabel}</bs.Button>
                <bs.Button bsStyle='default' onClick={() => { this.setState({ selectedGroups: selectedGroups.filter(group => group.clusterKey !== selectedCluster.key) }); }}>{noneLabel}</bs.Button>
              </div>

              <div style={{ margin: 20 }}>
                <DisplayParams
                  params={selectedParams}
                  limit={50}
                  show={50}
                  style={{ maxHeight: '60vh', overflow: 'auto' }}
                />
              </div>
            </bs.Col>
            </bs.Row>
          </bs.Modal.Body>
          
          <bs.Modal.Footer>
            <bs.Button onClick={() => { setValue(selectedGroups.map(group => group.value));  this.setState({showModal: false})} }>OK</bs.Button>
            <bs.Button onClick={() => this.setState({showModal: false})}>Cancel</bs.Button>
          </bs.Modal.Footer>
        </bs.Modal> 
        </div>
    );
  }
});

module.exports = WhereItem;
