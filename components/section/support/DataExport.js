var React = require('react');
var Bootstrap = require('react-bootstrap');
var { bindActionCreators } = require('redux');
var { connect } = require('react-redux');
var Table = require('../../Table');

var { fileChangeIndex, getFiles, getTrialFinalFiles, setFilter, clearFilter, download } = require('../../../actions/DataExportActions');

var descriptionText = (
  <div>
    <p style={{textAlign: 'justify'}}>All the exported data file names follow the naming convention shown below:</p>
    <p style={{color:'#565656'}}><b>[data source]-[utility]-[population]-[date].zip</b></p>
    <p style={{textAlign: 'justify'}}>A file name consists of four parts. The <b>data source</b> value can be either <b>meter</b> or <b>amphiro</b> and corresponds to 
       smart water meter or amphiro b1 data respectively. The <b>utility</b> refers to the area where the trial takes place 
       e.g. Alicante or St. Albans. The population can be either <b>trial</b> or <b>all</b>. The former refers to the registered users 
       that participate in the trial, while the latter refers to all registered users including development or demo user 
       accounts. The <b>date</b> is the file creation date and time.</p>
    <p style={{textAlign: 'justify'}}>Currently the Export Transform Load (ETL) job creates one or three files per utility depending on whether the utility 
       has smart water meters installed (e.g. Alicante). Each archive may contain multiple files.</p>
    <p style={{textAlign: 'justify'}}>Files contained in each archive are enumerated next.</p>
  </div>
);

var file1 = (
  <div>
    <ol>
      <li style={{textAlign: 'justify'}}><b>user.csv</b>: Lists all the users who participate in the trial together with the serial number of the smart water 
          meter assigned to them.</li>
      <li style={{textAlign: 'justify'}}><b>data.csv</b>: Contains smart water meter data from all meters assigned to users who participate in the DAIAD trial. 
          The file contains four columns, namely, meter id, local date time (e.g. Europe/Madrid time zone for Alicante), volume 
          and difference (from the previous reading).</li>
      <li style={{textAlign: 'justify'}}><b>phase-timestamp</b>: This file contains information about the trial phases for each user alongside with the 
          corresponding time intervals.
          Each line contains the following three phases (a) Baseline (Mobile Off / amphiro b1 Off) both the mobile application 
          and amphiro b1 display are disabled, (b) Phase 1 where either the mobile application or the amphiro b1 display is 
          enabled and (c) Phase 2 where both the mobile application and amphiro b1 display are enabled.</li>
    </ol>
  </div>
);

var file2 = (
  <div>
    <ol>
      <li style={{textAlign: 'justify'}}><b>data.csv</b>: Contains all the smart water meter data collected and stored by the DAIAD system. Same as above, the 
          file contains four columns, namely, meter id, local date time (e.g. Europe/Madrid time zone for Alicante), volume 
          and difference.</li>
    </ol>
  </div>
);

var file3 = (
  <div>
    <ol>
      <li style={{textAlign: 'justify'}}><b>error.csv</b>: Contains error messages generated by the system during the execution of 
          the ETL job. Each row consists of the unique user key, the user name, the unique device key and an error 
          description.</li>
      <li style={{textAlign: 'justify'}}><b>user.csv</b>: Lists all the users who participate in the trial. The file columns are the 
          unique user key and the user name.</li>
      <li style={{textAlign: 'justify'}}><b>phase-timestamp.csv</b>: This file contains information about the trial phases for each 
          device alongside with the corresponding time intervals.</li>
      <li style={{textAlign: 'justify'}}><b>phase-shower-id.csv</b>: As above, this file contains information about the trial phases 
          for each user alongside with the corresponding shower id intervals.</li>
      <li style={{textAlign: 'justify'}}><b>shower-data-all.csv</b>: Contains all the shower data. No filtering is applied. Except of 
          shower properties such as duration, volume and energy, each row contains two additional Boolean properties, namely, <i>history</i> and <i>ignore</i>. The first is <i>True</i> for historical showers and <i>False</i> for real-time ones. 
          The second is <i>True</i> only for showers that the user has characterized as not being showers.</li>
      <li style={{textAlign: 'justify'}}><b>shower-data-valid.csv</b>: Contains the shower data that has passed all validation 
          rules.</li>
      <li style={{textAlign: 'justify'}}><b>shower-data-removed.csv</b>: Contains shower data that has failed to pass 
          any of the validation rules.</li>
      <li style={{textAlign: 'justify'}}><b>shower-data-removed-index.csv</b>: Contains the indexes of the showers that have failed to pass any of the validation rules
          for each amphiro b1 device .</li>
      <li style={{textAlign: 'justify'}}><b>shower-time-series</b>: This file contains the time-series for the amphiro b1 
          real-time showers.</li>
    </ol>
  </div>
);

var DataExport = React.createClass({
  contextTypes: {
      intl: React.PropTypes.object
  },

  componentWillMount : function() {
    if(this.props.files.items == null) {
      this.props.actions.getFiles();
      this.props.actions.getTrialFinalFiles();
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
    var pinnedFiles = this.props.pinnedFiles;

    var finalExportTableFields = [{
        name: 'key',
        title: 'Section.Support.DataExport.Table1.Key',
        hidden: true
      }, {
        name: 'utility',
        title: 'Section.Support.DataExport.Table1.Utility'
      }, {
        name: 'filename',
        title: 'Section.Support.DataExport.Table1.Name'
      }, {
        name: 'description',
        title: 'Section.Support.DataExport.Table1.Description'
      }, {
        name: 'size',
        title: 'Section.Support.DataExport.Table1.Size'
      }, {
        name: 'completedOn',
        title: 'Section.Support.DataExport.Table1.CreatedOn',
        type: 'datetime'
      }, {
        name: 'download',
        type:'action',
        icon: 'cloud-download',
        handler: (function(field, row) {
          this.props.actions.download(row.key, row.filename);
        }).bind(this)
      }];

    const finalExportTableData = pinnedFiles || [];

    var exportTableFields = [{
        name: 'key',
        title: 'Section.Support.DataExport.Table2.Key',
        hidden: true
      }, {
        name: 'utility',
        title: 'Section.Support.DataExport.Table2.Utility'
      }, {
        name: 'filename',
        title: 'Section.Support.DataExport.Table2.Name'
      }, {
        name: 'description',
        title: 'Section.Support.DataExport.Table2.Description'
      }, {
        name: 'size',
        title: 'Section.Support.DataExport.Table2.Size'
      }, {
        name: 'completedOn',
        title: 'Section.Support.DataExport.Table2.CreatedOn',
        type: 'datetime'
      }, {
        name: 'download',
        type:'action',
        icon: 'cloud-download',
        handler: (function(field, row) {
          this.props.actions.download(row.key, row.filename);
        }).bind(this)
      }];

    const exportTableData = files.items || [];

    const exportPager = {
      index: files.index || 0,
      size: files.size || 10,
      count: files.total || 0,
      mode: Table.PAGING_SERVER_SIDE,
      onPageIndexChange : this.onFilePageIndexChange
    };

    const fileNotFound = (
      <span>No files found.</span>
    );

    return (
      <div className='container-fluid' style={{ paddingTop: 10 }}>
        <div className='row'>
          <div className='col-md-12'>
            <Bootstrap.Panel>
              <Bootstrap.ListGroup fill>
                <Bootstrap.ListGroupItem style={{background : '#f5f5f5'}}>
                  <i className='fa fa-exclamation  fa-fw'></i>
                  <span style={{ paddingLeft: 4 }}>Trial Final Data Export</span>
                </Bootstrap.ListGroupItem>
                <Bootstrap.ListGroupItem>
                  <Table  
                    fields={finalExportTableFields}
                    data={finalExportTableData}
                    template={{empty : fileNotFound}}
                  />
                </Bootstrap.ListGroupItem>
                <Bootstrap.ListGroupItem style={{background : '#f5f5f5'}}>
                  <i className='fa fa-file-archive-o fa-fw'></i>
                  <span style={{ paddingLeft: 4 }}>Files</span>
                </Bootstrap.ListGroupItem>
                <Bootstrap.ListGroupItem>
                  <Table  
                    fields={exportTableFields}
                    data={exportTableData}
                    pager={exportPager}
                    template={{empty : fileNotFound}}
                  />

                </Bootstrap.ListGroupItem>
                <Bootstrap.ListGroupItem style={{background : '#f5f5f5'}}>
                  <i className='fa fa-life-ring fa-fw'></i>
                  <span style={{ paddingLeft: 4 }}>Description</span>
                </Bootstrap.ListGroupItem>
                <Bootstrap.ListGroupItem>
                  {descriptionText}
                </Bootstrap.ListGroupItem>
                <Bootstrap.ListGroupItem style={{background : '#f5f5f5'}}>
                  <i className='fa fa-arrow-right  fa-fw'></i>
                  <span style={{ paddingLeft: 4 }}>meter-[utility]-trial-[date].zip</span>
                </Bootstrap.ListGroupItem>
                <Bootstrap.ListGroupItem>
                  {file1}
                </Bootstrap.ListGroupItem>
                <Bootstrap.ListGroupItem style={{background : '#f5f5f5'}}>
                  <i className='fa fa-arrow-right  fa-fw'></i>
                  <span style={{ paddingLeft: 4 }}>meter-[utility]-all-[date]</span>
                </Bootstrap.ListGroupItem>
                <Bootstrap.ListGroupItem>
                  {file2}
                </Bootstrap.ListGroupItem>
                <Bootstrap.ListGroupItem style={{background : '#f5f5f5'}}>
                  <i className='fa fa-arrow-right  fa-fw'></i>
                  <span style={{ paddingLeft: 4 }}>amphiro-[utility]-trial-[date].zip</span>
                </Bootstrap.ListGroupItem>
                <Bootstrap.ListGroupItem>
                  {file3}
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
DataExport.title = 'Section.Support.DataExport.Title';

function mapStateToProps(state) {
  return {
      query: state.dataExport.query,
      files: state.dataExport.files,
      pinnedFiles: state.dataExport.pinnedFiles,
      isLoading: state.dataExport.isLoading,
      routing: state.routing
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions : bindActionCreators({
      fileChangeIndex,
      getFiles,
      getTrialFinalFiles,
      setFilter,
      clearFilter,
      download
    } , dispatch)
  };
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(DataExport);
