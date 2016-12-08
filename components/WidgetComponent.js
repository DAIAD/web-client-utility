var React = require('react');
var echarts = require('react-echarts');
var theme = require('./chart/themes/blue');
var { Map, TileLayer, HeatLayer, LayersControl, InfoControl } = require('react-leaflet-wrapper');

function WidgetPanel (props) {
  const { widgets } = props;
  return (
    <div>
      {
        widgets.map((widget => <Widget {...widget} />))
      }
    </div>
  );
}

function Widget (props) {
  const widget = props.widget;
  const { error, display,title, footer } = widget;
  //const _t = intl.formatMessage;
  return (
    <div className='infobox'>
      <div className='infobox-header'>
        <h4>{title}</h4>
      </div>
      <div className='infobox-body'>
         {
           (() => {
             if (error) {
               return (<div />);
               }
             else {
               if (display==='stat') {
                 return (
                    <StatBox {...widget} />
                 );
               }
               else if (display==='chart') {
                 return (
                   <div {...widget} /> 
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

module.exports = {
  WidgetPanel
};
