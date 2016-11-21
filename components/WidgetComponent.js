var React = require('react');

function WidgetPanel (props) {
  const { rows, intl } = props;
  return (
    <table>
      <tr>
        <th>Goal</th>
        <th>Savings</th>
        <th>Affected</th>
      </tr>
       {
         rows.map(function(row) {
           return (
             <tr key={row.id}>
               {row.title}
               {
                 row.widgets.map(function(widget) {
                   return (
                     <td key={widget.id}>
                       <Widget widget={widget} intl={intl} /> 
                   </td>
                   );
                })
               }
             </tr>
             );
         })
       }
     </table>
  );
}

function Widget (props) {
  const widget = props.widget;
  const { error, display, title, footer, style } = widget;
  //const _t = intl.formatMessage;
  return (
    <div className='infobox' style={style} >
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
                    <StatBox {...widget} />
                 );
               }
               else if (display==='chart') {
                 return (
                   <div {...widget} /> 
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

function StatBox (props) {
  const { highlight, info } = props;
  return (
    <div>  
      <div style={{float: 'left', width: highlight ? (info && info.length > 0 ? '33%' : '100%') : '0%'}}>
        <h2>{highlight}</h2>
      </div>
      <div style={{float: 'left', width: info && info.length > 0 ? (highlight  ? '65%' : '100%') : '0%'}}>
        <div>
          <ul style={{listStyle: 'unstyled'}}>
          {
            info.map(infoLine => (
              <li>{infoLine}</li>
              ))
          }
        </ul>
        </div>
      </div>
    </div>
  );
}

module.exports = {
  WidgetPanel,
  Widget
};
