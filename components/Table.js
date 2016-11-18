var React = require('react');

var { injectIntl, FormattedTime, FormattedDate} = require('react-intl');
var { Link } = require('react-router');

var Bootstrap = require('react-bootstrap');
var Checkbox = require('./Checkbox');
var CellCheckbox = require('./CellCheckbox');

const PAGING_CLIENT_SIDE = 'client';
const PAGING_SERVER_SIDE = 'server';
const DEFAULT_PAGE = 1;

var Table = React.createClass({
  getInitialState: function() {
    return {
      activePage: this.props.defaultPage 
    };
  },
  
  getDefaultProps: function() {
    return {
      defaultPage: DEFAULT_PAGE,
      data: [],
      fields: [], 
      template: {
        empty: null
      },
      style: {}
    };
  },

  componentWillMount: function() {
     
   },
  componentDidMount: function() {
    if (this.props.pager && this.props.pager.mode === PAGING_SERVER_SIDE) {
      if (typeof this.props.pager.onPageIndexChange !== 'function') {
        throw `onPageIndexChange function must be provided as property in pager object. Check Table`;
      }  
    }
  },

  componentWillReceiveProps: function(nextProps) {
    //if data length is changed make sure to return to default page
    if (nextProps.pager && 
        nextProps.pager.count != this.props.pager.count && 
        this.state.activePage != this.props.defaultPage
       ) {
         this.setState({ activePage: this.props.defaultPage }); 
    }
    if (nextProps.pager &&
        nextProps.pager.index != this.props.pager.index
       ) {
         this.setState({ activePage: nextProps.pager.index+1 });
       }
  },

  getStyle: function() {
    return {
      table: {
        ...this.props.style.table
      },
      header: {
        textAlign: 'left',
        ...this.props.style.header
      },
      body: {
        ...this.props.style.body
      },
      footer: {
        ...this.props.style.footer
      },
      pager: {
        float: 'right',
        ...this.props.style.pager
      },
      row: this.props.style.row,
    };
  },

  getPager: function() {
    return {
      size: 10,
      //index: DEFAULT_PAGE-1,
      mode: PAGING_CLIENT_SIDE,
      count: Array.isArray(this.props.data) ? this.props.data.length : 0, 
      ...this.props.pager
    };
  },

  onPageIndexChange: function (event, selectedEvent) {
    if (typeof this.props.pager.onPageIndexChange === 'function') {
      this.props.pager.onPageIndexChange(selectedEvent.eventKey-1);
    }

    this.setState({
      activePage: selectedEvent.eventKey
    });
  },

  render: function() {
    const { activePage, sort, order } = this.state;
    const { fields, data, template, intl, sortable } = this.props;
    
    if (!Array.isArray(data)) { 
      if (template.empty) {
        return template.empty;
      }
      else {
        return null; 
      }
    }

    const pager = this.getPager();
    const style = this.getStyle();

    const totalPages = (pager && pager.count && pager.size) ?
      Math.ceil(pager.count / pager.size) : 1;
      
    const visibleFields = fields.filter(field => !field.hidden);
    const filteredData = (pager && pager.size && pager.mode && pager.mode === PAGING_CLIENT_SIDE) ? 
      data.filter((row, idx) => (
        idx >= (activePage - 1) * pager.size && 
        idx < (activePage) * pager.size))
        : 
          data;

    if((filteredData.length === 0) && (template.empty)) {
      return(
        template.empty
      );
    }
    return (
      <div className='clearfix'>
        <div style={{overflow: 'auto'}}>
          <Bootstrap.Table
            hover
            style={style.table}
          >
            <Table.Header 
              fields={visibleFields} 
              intl={intl}
              style={style.header}
            />
            <Table.Body 
              fields={visibleFields}
              data={filteredData}
              bodyStyle={style.body}
              rowStyle={style.row}
            />
          </Bootstrap.Table>
        </div>
        <div style={style.footer}>
          <Table.Pager
            pager={pager != null}
            totalPages={totalPages}
            activePage={activePage}
            onPageIndexChange={this.onPageIndexChange}
            style={style.pager}
          /> 
        </div>
      </div>
     );
  }
});

function Pager (props) {
  const { pager, totalPages, activePage, onPageIndexChange, style } = props;
  if (!pager) {
    return <div />;
  }
  return (
    <div>
      <Bootstrap.Pagination 
        prev
        next
        first
        last
        ellipsis
        items={totalPages}
        maxButtons={7}
        activePage={activePage}
        onSelect={(event, selectedEvent) => { 
          event.preventDefault(); 
          onPageIndexChange(selectedEvent.eventKey)
        }} 
        style={style}
      />
    </div>
  );
}

function Header (props) {
  const { fields, intl, style } = props;
  const _t = intl.formatMessage;
  return (
    <thead>
      <tr>
        {
          fields.map(field => (
            <th 
              key={field.name} 
              style={style}
            >
              { field.title ? _t({ id: field.title }) : '' }
            </th>
            ))
            
        }
      </tr>
    </thead>
   );
}

function Body (props) {
  const { data, fields, bodyStyle, rowStyle } = props;
  return (
    <tbody style={bodyStyle}>
      {
        data.map((row, rowIndex, total) => (
          <Table.Row
            key={rowIndex}
            fields={fields}
            row={row}
            style={typeof rowStyle === 'function' ? rowStyle(row, rowIndex, total.length) : rowStyle}
          />
          ))
      }
      </tbody>
  );
}

function Row (props) {
  const { fields, row, style } = props;
  return (
    <tr style={style}>
      {
        fields
        .map((field, columnIdx) => (
          <Table.Cell
            key={columnIdx}
            row={row}
            field={field}
          />
        ))
      }
    </tr>
  );
}

function Cell (props) {
  const { row, field, style:tableStyle } = props;

  const content = wrapWithLink(getCell(field, row), field, row);
  const style = typeof field.style === 'function' ? 
    field.style(field, row)
      :
        field.style;
  const className = (typeof field.className === 'function') ? 
    field.className(field, row) 
    //field.className(value)
      : 
        field.className;
  return (
    <td
      style={style} 
      className={className}>
        {content}
    </td>
  );
}

//helper functions
function getCell (field, row) {

  const value = row[field.name];

  if (field.type !== 'action' && field.type !== 'alterable-boolean' && !value) {
    return <span />;
  }

  if (!field.type) {
    return <span>{value}</span>;
  }
  else if (field.type === 'action') {
    
    const visible = (typeof field.visible === 'function') ? field.visible(field, row) : true;

    if (visible) {
      const icon = (typeof field.icon === 'function') ? field.icon(field, row) : field.icon;
      const image = (typeof field.image === 'function') ? field.image(field, row) : field.image;
      const className = icon ? 'fa fa-' + icon + ' fa-fw' : '';
      const clickHandler = (typeof field.handler === 'function') ? () => field.handler(field, row) : null;
      const style = clickHandler ? ({ cursor: 'pointer' })  : ({});

      return (
        <i className={className}
          style={style}
          onClick={clickHandler}
          >
          { image ? <img src={image} /> : <span /> }
        </i>
      );
    }
    else {
      return <span />;
    }
  }
  else if (field.type === 'datetime') {
    return (
      <FormattedTime   
        value={value}
        day='numeric'
        month='numeric'
        year='numeric'
        hour='numeric'
        minute='numeric' 
        />
    );
  }
  else if (field.type === 'date' || value instanceof Date) {
    return (
      <FormattedDate 
        value={value} 
        day='numeric' 
        month='long' 
        year='numeric' 
      />
    );
  }
  else if (field.type === 'time') {
    return (
      <FormattedTime
        value={value}
        hour='numeric'
        minute='numeric' />
    );
  }
  else if (field.type === 'progress') {
    return (
      <Bootstrap.ProgressBar 
        now={value} 
        label="%(percent)s%"
      />
    );
  }
  else if (field.type === 'alterable-boolean') {
    return (
      <CellCheckbox
        checked={value}
        rowId={row.id}
        propertyName={field.name}
        disabled={false}
        onUserClick={field.handler}
      />
    );
  }
  else if (field.type === 'boolean' || (typeof value === 'boolean')) {
    return (
      <Checkbox 
        checked={value} 
        disabled
      />
    );
  }
  else if (field.type === 'element') {
    return value;
  }
  else {
    console.warn('Cell type [' + field.type + '] is not supported.');
  }
}

function wrapWithLink(text, field, row) {
  if(field.hasOwnProperty('link')) {
    if(typeof field.link === 'function') {
      var href = field.link(row);
      if(href) {
        return <Link to={formatLink(field.link(row), row)}>{text}</Link>;
      }
    } else {
      return <Link to={formatLink(field.link, row)}>{text}</Link>;
    }
  }
  else { 
    return text;
  }
}

function formatLink (route, row) {
  return Object.keys(row).reduce(function(link, key) {
    return link.replace(new RegExp('\{' + key + '\}'), row[key]);
  }, route);
}

Table.Header = Header;
Table.Body = Body;
Table.Row = Row;
Table.Cell = Cell;
Table.Pager = Pager;

Table.PAGING_CLIENT_SIDE = PAGING_CLIENT_SIDE;
Table.PAGING_SERVER_SIDE = PAGING_SERVER_SIDE;

module.exports = injectIntl(Table);
