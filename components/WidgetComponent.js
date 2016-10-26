var React = require('react');

function WidgetPanel (props) {
  const { widgets, intl } = props;
  return (
    <div className='report-widgets'>
       {
         widgets.map(function(widget) {
           return (
             <div key={widget.id} className='widget'>
               <Widget widget={widget} intl={intl} /> 
           </div>
           );
         })
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

  //const arrowClass = better?"fa-arrow-down green":"fa-arrow-up red";
  //const bow = (better==null || comparePercentage == null) ? false : true;
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
  WidgetPanel
};
