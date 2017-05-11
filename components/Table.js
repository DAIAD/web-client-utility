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
      activePage: this.props.defaultPage,
      sort: this.getSorter().defaultSort,
      order: this.getSorter().defaultOrder
    };
  },
  
  getDefaultProps: function() {
    return {
      defaultPage: DEFAULT_PAGE,
      sortable: false,
      data: [],
      fields: [], 
      pager: {
        size: 10,
        index: DEFAULT_PAGE-1,
        mode: PAGING_CLIENT_SIDE,
      },
      template: {
        empty: null
      },
      style: {}
    };
  },

  componentDidMount: function() {
    if (this.props.pager && this.props.pager.mode === PAGING_SERVER_SIDE) {
      if (typeof this.props.pager.onPageIndexChange !== 'function') {
        throw `onPageIndexChange function must be provided as property in pager object for server side paging. Check Table`;
      }
      if (this.props.sortable && typeof this.props.sorter.onSortChange !== 'function') {
        throw `onSortChange function must be provided as property in sorter object with server side paging. Check Table`;
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

  getSorter: function() {
    const firstVisible = this.props.fields.find(it => !it.hidden);
    return {
      defaultSort: firstVisible ? firstVisible.name : null,
      defaultOrder: 'asc',
      ...this.props.sorter
    };
  },

  getPager: function() {
    return { 
      count: Array.isArray(this.props.data) ? this.props.data.length : 0, 
      ...this.props.pager
    };
  },

  getSortOrderOnClick: function(key) {
    if (this.state.sort === key) {
      return this.state.order === 'asc' ? 'desc' : 'asc';
    }
    else {
      return 'asc';
    }
  },

  onSortChange: function(key) {
    const order = this.getSortOrderOnClick(key);

    if (typeof this.getSorter().onSortChange === 'function') {
      this.getSorter().onSortChange(key, order);
    }

    this.setState({ sort: key, order });
    this.onPageIndexChange(this.props.defaultPage); 
  },

  onPageIndexChange: function (index) {
    if (typeof this.props.pager.onPageIndexChange === 'function') {
      this.props.pager.onPageIndexChange(index-1);
    }

    this.setState({
      activePage: index
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
      data.sort((a, b) => {
        const compA = normalize(a);
        const compB = normalize(b);
        if (compA[sort] > compB[sort]) {
          return order === 'asc' ? 1 : -1;
        }
        else if (compA[sort] < compB[sort]) {
          return order === 'asc' ? -1 : 1;
        }
        return 0;
      })
      .filter((row, idx) => (
        idx >= (activePage - 1) * pager.size && 
        idx < (activePage) * pager.size))
        : 
          data;

    if((filteredData.length === 0) && (template.empty)) {
      return template.empty;
    }
    return (
      <div className='clearfix'>
        <div style={{overflow: 'auto'}}>
          <Bootstrap.Table
            hover
            style={style.table}
          >
            <Header 
              fields={visibleFields} 
              intl={intl}
              style={style.header}
              sortable={sortable}
              onSortChange={this.onSortChange}
              activeSort={sort}
              activeSortOrder={order}
            />
            <Body 
              fields={visibleFields}
              data={filteredData}
              bodyStyle={style.body}
              rowStyle={style.row}
            />
          </Bootstrap.Table>
        </div>
        <div style={style.footer}>
          <Pager
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
  const { fields, intl, style, sortable, activeSort, activeSortOrder, onSortChange } = props;
  const _t = intl.formatMessage;
  return (
    <thead>
      <tr>
        {
          fields.map(field => 
            <th 
              key={field.name} 
              style={style}
            >
            { 
              wrapWithSort(field.title ? _t({ id: field.title }) : '',
                     field, sortable, onSortChange, activeSort===field.name, activeSortOrder)
            }
            </th>
            )
        }
      </tr>
    </thead>
   );
}

function wrapWithSort (content, field, sortable, onSortChange, active, order) {
  return (!sortable || field.sortable === false || field.type === 'action' || field.type === 'alterable-boolean') ? 
    content
      :
        <a 
          style={{ cursor: 'pointer' }} 
          onClick={() => onSortChange(field.name)}>
          {content}&nbsp;
          {active ? 
            (order === 'asc' ? 
             <i className='fa fa-angle-up' /> 
               : 
                 <i className='fa fa-angle-down' />
                 ) 
                   :
                     <i />
          }
        </a>;
}

function Body (props) {
  const { data, fields, bodyStyle, rowStyle } = props;
  return (
    <tbody style={bodyStyle}>
      {
        data.map((row, rowIndex, total) => (
          <Row
            key={rowIndex}
            fields={fields}
            row={row}
            style={getPropertyValue(rowStyle, row, rowIndex, total.length)}
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
          <Cell
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
  const { row, field } = props;

  const style = getPropertyValue(field.style, field, row);
  const className = getPropertyValue(field.className, field, row);

  const content = wrapWithLink(getCell(field, row, className), field.link, row);

  return (
    <td style={style}>
      {content}
    </td>
  );
}

//helper functions
function getCell (field, row, className) {

  const value = row[field.name];

  //only action, alterable boolean allowed to have falsy value
  if (field.type !== 'action' && field.type !== 'alterable-boolean' && value == null) {
    return <div />;
  }

  if (!field.type) {
    return <div className={className}>{value}</div>;
  }
  else if (field.type === 'action') {
    
    const visible = getPropertyValue(field.visible, field, row);

    if ((visible == null) || (visible)) {
      const icon = getPropertyValue(field.icon, field, row);
      const image = getPropertyValue(field.image, field, row);
      const className = icon ? `fa fa-${icon} fa-fw` : getPropertyValue(field.className, field, row);
      const color = getPropertyValue(field.color, field, row);
      const clickHandler = () => getPropertyValue(field.handler, field, row);
      const style = clickHandler ? ({ color, cursor: 'pointer' })  : ({});

      return (
        <i className={className}
          style={style}
          onClick={clickHandler}
          >
          { image ? <img src={image} /> : <div /> }
        </i>
      );
    }
    else {
      return <div />;
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

function getPropertyValue(property) {
  //all args after first
  const args = Array.prototype.slice.call(arguments, 1);
  return typeof property === 'function' ?
    property.apply(null, args) : property;
}


function wrapWithLink(content, link, row) {
  return link ? 
    <Link to={formatLink(getPropertyValue(link, row), row)}>{content}</Link>
    :
      content;
}

function formatLink (route, row) {
  return Object.keys(row).reduce((link, key) => 
          link && link.replace(new RegExp('\{' + key + '\}'), row[key]) || ''
          , route);
}

function normalize (input) {
  if (typeof input === 'string') {
    return input.toLowerCase();
  }
  return input;
}

const IntlTable =  injectIntl(Table);

IntlTable.PAGING_CLIENT_SIDE = PAGING_CLIENT_SIDE;
IntlTable.PAGING_SERVER_SIDE = PAGING_SERVER_SIDE;

module.exports = IntlTable;
