var React = require('react');
var bs = require('react-bootstrap');
var echarts = require('react-echarts');
var theme = require('./chart/themes/blue');
var { Map, TileLayer, HeatLayer, LayersControl, InfoControl } = require('react-leaflet-wrapper');
var DisplayParams = require('./DisplayParams');

function Widget (props) {
  const { error, display, title, footer, style } = props;
  return (
    <div className='infobox'>
        {
          title ? 
           <div className='infobox-header'>
             <h4>{title}</h4>
           </div>
           :
            <div />
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
                    <Stat {...props} />
                 );
               }
               else if (display==='chart') {
                 return (
                   <BarChart {...props} /> 
                   );
               }
               else if (display === 'map') {
                 return (
                   <Heatmap {...props} />
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

function Heatmap(props) {
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

function BarChart(props) {
  const { xAxis, yAxis, series, grid, style={} } = props;
  return (
    <echarts.LineChart
      width={style.width ? style.width : '100%'}
      height={style.height ? style.height : '100%'}
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
        x: '12%',
        y: '-20%',
        x2: '7%',
        y2: '15%',
        ...grid
      }}
      series={series}
    />
  );
}


function Stat (props) {
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


module.exports = Widget;
