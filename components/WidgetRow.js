var React = require('react');
var bs = require('react-bootstrap');
var Widget = require('./WidgetComponent');

function toNlets(array, n) {
  return array.reduce((p, c, i, arr) => i % n === 0 ? [...p, arr.slice(i, i+n)] : p, []);
}

function WidgetRow(props) {
  const { widgets, style={}, itemsPerRow=3 } = props;
  if (!Array.isArray(widgets)) return <div />;
  const nlets = toNlets(widgets, itemsPerRow);
  return (
    <div>
      {
        nlets.map((widgets, i) =>  
          <bs.Row key={i} style={{ marginBottom: 20, ...style }} >
            {
              widgets.map(widget => (
                <bs.Col md={Math.floor(12/itemsPerRow)}
                  key={widget.id} 
                  >
                  <Widget {...widget} />
              </bs.Col>
              ))
            }
          </bs.Row>
          )
      }
    </div>
  );
}
module.exports = WidgetRow;
