var React = require('react');
var Bootstrap = require('react-bootstrap');
var { bindActionCreators } = require('redux');
var { connect } = require('react-redux');
var Table = require('../../Table');

var { fileChangeIndex, getFiles, setFilter, clearFilter, download } = require('../../../actions/DataExportActions');

var DataExport = React.createClass({
  contextTypes: {
      intl: React.PropTypes.object
  },

  componentWillMount : function() {
    if(this.props.files.items == null) {
      this.props.actions.getFiles();
    }
  },

  onFilePageIndexChange: function(index) {
    this.props.actions.fileChangeIndex(index);
  },

  setfilter: function(e) {
    this.props.actions.setFilter({});
  },

  clearFilter: function(e) {
    this.props.actions.clearFilter();
  },

  render: function() {
    var files = this.props.files;

    var executionTableConfig = {
      fields: [{
        name: 'key',
        title: 'key',
        hidden: true
      }, {
        name: 'utility',
        title: 'Utility'
      }, {
        name: 'filename',
        title: 'Name'
      }, {
        name: 'description',
        title: 'Description'
      }, {
        name: 'size',
        title: 'Size'
      }, {
        name: 'completedOn',
        title: 'Created On',
        type: 'datetime'
      }, {
        name: 'download',
        type:'action',
        icon: 'cloud-download',
        handler: (function(field, row) {
          this.props.actions.download(row.key);
        }).bind(this)
      }],
      rows: files.items || [],
      pager: {
        index: files.index || 0,
        size: files.size || 10,
        count: files.total || 0,
        mode: Table.PAGING_SERVER_SIDE
      }
    };

    const fileNotFound = (
      <span>No files found.</span>
    );

    var header = (
      <span>
        <i className='fa fa-file-archive-o fa-fw'></i>
        <span style={{ paddingLeft: 4 }}>Files</span>
      </span>
    );

    return (
      <div className='container-fluid' style={{ paddingTop: 10 }}>
        <div className='row'>
          <div className='col-md-12'>
            <Bootstrap.Panel header={header}>
              <Bootstrap.ListGroup fill>
                  <Bootstrap.ListGroupItem>
                  <Table  data={executionTableConfig}
                          onPageIndexChange={this.onFilePageIndexChange}
                          template={{empty : fileNotFound}}
                  ></Table>
                </Bootstrap.ListGroupItem>
              </Bootstrap.ListGroup>
            </Bootstrap.Panel>
          </div>
        </div>
      </div>
    );
  }
});

DataExport.icon = 'fa-file-archive-o';
DataExport.title = 'Section.Support.DataExport';

function mapStateToProps(state) {
  return {
      query: state.dataExport.query,
      files: state.dataExport.files,
      isLoading: state.dataExport.isLoading,
      routing: state.routing
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions : bindActionCreators({
      fileChangeIndex,
      getFiles,
      setFilter,
      clearFilter,
      download
    } , dispatch)
  };
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(DataExport);
