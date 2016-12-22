var React = require('react');
var { findDOMNode } = require('react-dom');
var bs = require('react-bootstrap');
var { BarChart } = require('react-echarts');
var { Map, TileLayer, HeatLayer, LayersControl, InfoControl } = require('react-leaflet-wrapper');
var DisplayParams = require('./DisplayParams');
var maximizable = require('./Maximizable');

function Widget (props) {
  const { error, display, title, footer, style, maximizable=false, maximizedProps, maximized, maximize, minimize } = props;
  //const innerProps = maximized ? { ...props, ...maximizedProps } : props;
  return (
    <div className='infobox'>
        {
           <div className='infobox-header'>
             {
               maximizable ? 
                 (
                   maximized ? 
                     <h1 style={{ marginLeft: 20 }}>
                       {title ? <span>{title}</span> : <div /> }
                        <bs.Button style={{ float: 'right' }} bsStyle='default' onClick={minimize}><i className='fa fa-search-minus'/></bs.Button>
                    </h1>
                   :
                     <h4>
                       {title ? <span>{title}</span> : <div /> }
                       <bs.Button style={{ float: 'right' }} bsStyle='default' onClick={maximize}><i className='fa fa-search-plus'/></bs.Button>
                     </h4>
                     )  
                     : 
                       ( title ? <h4>{title}</h4> : <div /> )
             }
           </div>
        }
      <div className='infobox-body'>
         {
           (() => {
             if (error) {
               return (<div />);
               }
             else {
               if (display==='stat') {
                 return (
                    <StatWidget {...props} />
                 );
               }
               else if (display==='chart') {
                 return (
                   <BarChartWidget {...props} /> 
                   );
               }
               else if (display === 'map') {
                 return (
                   <HeatmapWidget {...props} />
                   );
               }
               else return null;
             }
           })()
         }
       </div>
       <div className='infobox-footer'>
        {footer}
       </div>
     </div>
  );
}

function HeatmapWidget(props) {
  const { style={}, data, map } = props;
  return (
    <Map
      center={[38.36, -0.479]}
      zoom={12}
      width={style.width}
      height={style.height}
      >
      <TileLayer />
      <HeatLayer
        data={data}
        radius={10}
      />
    </Map>
  );
}

var BarChartWidget = React.createClass({
  componentDidMount: function() {
    this.node = findDOMNode(this);
  },
  render: function() {
    const { xAxis, yAxis, series, grid, viewportWidth, viewportHeight, style={}, theme } = this.props;
    return (
      <div style={{ height: style.height }}>
        <BarChart
          width={this.node ? this.node.clientWidth : null}
          height={this.node ? this.node.clientHeight : style.height}
          horizontal
          legend={false}
          theme={theme}
          xAxis={{
            boundaryGap: true,
            ...xAxis
          }}
          yAxis={{
            formatter: y => (y.toString() + '%'),
            numTicks: 3,
            min: 0,
            ...yAxis
          }}
          grid={{
            x: '15%',
            y: '-2%',
            ...grid
          }}
          series={series}
        />
      </div>
    );
  }
});


function StatWidget (props) {
  const { highlight, info, limit, show, style={} } = props;
  return (
    <div style={{ height: 120, ...style}}>
      <div style={{float: 'left', width: highlight ? (Array.isArray(info) && info.length > 0 ? '33%' : '100%') : '0%'}}>
        <h1 style={{ marginTop: 0, fontSize: '2.5em' }}>{highlight}</h1>
      </div>
      <div style={{float: 'left', width: Array.isArray(info) && info.length > 0 ? (highlight  ? '63%' : '100%') : '0%'}}>
        { 
          Array.isArray(info) ?
          <DisplayParams 
            params={info} 
            limit={limit}
            show={show}
            style={{ lineHeight: '1.7em' }}
          /> 
            : 
              <div />
        }
      </div>
    </div>
  );
}


module.exports = maximizable(Widget);
