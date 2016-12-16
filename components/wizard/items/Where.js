var React = require('react');
var bs = require('react-bootstrap');
var { Map, TileLayer, GeoJSON, InfoControl } = require('react-leaflet-wrapper');
var DisplayParams = require('../../DisplayParams');

var WhereItem = React.createClass({
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
    const { setValue, clusters, value, noAll, intl, geojson, id } = this.props;

    const _t = x => intl.formatMessage({ id: x });
    const allLabel = _t('Buttons.All');
    const noneLabel = _t('Buttons.None');

    const { selectedCluster, selectedGroups } = this.state;

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
      //label: clusters.find(cluster => cluster.key === group.clusterKey).name + ': ' + group.name
      label: group.name
    }));
   
    return (
      <div>

        <bs.Col md={4}>
          <bs.ButtonGroup vertical block>
            { !noAll ? 
              <bs.Button bsSize='large' bsStyle={value.value === 'all' ? 'primary' : 'default'} style={{marginBottom: 10}} onClick={() => setValue({value:'all', label: allLabel})}>{allLabel}</bs.Button>
              :
                <div />
            }
            <bs.Button bsSize='large' bsStyle={Array.isArray(value) ? 'primary' : 'default'} style={{marginBottom: 10}} onClick={() => this.setState({showModal: true})}>{_t('Wizard.common.choose')}</bs.Button>

          </bs.ButtonGroup>
        </bs.Col>
        <bs.Col md={7}>
          <DisplayParams
            params={selectedParams}
            limit={4}
          />
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
                <bs.Button bsStyle='primary' style={{ marginRight: 5 }} onClick={() => { this.setState({ selectedGroups: [...selectedGroups.filter(group => group.clusterKey !== selectedCluster.key), ...selectedCluster.groups] }); }}>{allLabel}</bs.Button>
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
            <bs.Button onClick={() => { setValue(displayGroups);  this.setState({showModal: false})} }>OK</bs.Button>
            <bs.Button onClick={() => this.setState({showModal: false})}>Cancel</bs.Button>
          </bs.Modal.Footer>
        </bs.Modal> 
        </div>
    );
  }
});

module.exports = WhereItem;
