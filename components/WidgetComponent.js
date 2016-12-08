var React = require('react');
var echarts = require('react-echarts');
var theme = require('./chart/themes/blue');
var { Map, TileLayer, HeatLayer, LayersControl, InfoControl } = require('react-leaflet-wrapper');

function Widget (props) {
  const { error, display, title, footer, style } = props;
  //const _t = intl.formatMessage;
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
  const { style, data, map } = props;
  return (
    <Map
      center={[38.36, -0.479]}
      zoom={12}
      style={{ width: style.width || '100%', height: style.height || 600 }}
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
  const { xAxis, yAxis, series, grid, style } = props;
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
        x: '18%',
        y: '-10%',
        x2: '7%',
        y2: '15%',
        ...grid
      }}
      series={series}
      invertAxis
    />
  );
}

function Stat (props) {
  const { highlight, info, style } = props;
  /*
  const onlyHighlight = highlight && (!info || info.length === 0);
  const onlyInfo = !highlight && info && info.length > 0;
  const highlightAndInfo = highlight && info && info.length > 0;
  */
  return (
    <div style={style}>
      <div style={{float: 'left', width: highlight ? (info && info.length > 0 ? '33%' : '100%') : '0%'}}>
        <h2>{highlight}</h2>
      </div>
      <div style={{float: 'left', width: info && info.length > 0 ? (highlight  ? '65%' : '100%') : '0%'}}>
        <div>
          <ul style={{listStyle: 'none'}}>
          {
            info.map((infoLine, idx) => (
              <li key={idx}>{infoLine}</li>
              ))
          }
        </ul>
        </div>
      </div>
    </div>
  );
}

module.exports = Widget;
