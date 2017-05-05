var React = require('react');
var Bootstrap = require('react-bootstrap');
var { bindActionCreators } = require('redux');
var { connect } = require('react-redux');
var Select = require('react-select');
var Table = require('../Table');
var Chart = require('../reports-measurements/chart');

var { getGroups, changeIndex, deleteGroup, getGroupChart, 
      clearChart, setChartMetric, removeFavorite, addFavorite,
      filterByType, filterByName, clearFilter } = require('../../actions/GroupCatalogActions');

var _handleKeyPress = function(e) {
  if (e.key === 'Enter') {
    this.refresh();
  }
};

var _setChartMetric = function(e) {
  var utility = this.props.profile.utility;
  this.props.actions.setChartMetric(e.value, utility.name, utility.timezone);
  var utility = this.props.profile.utility;
  var population;
};

var _clearChart = function(e) {
  this.props.actions.clearChart();
};

var _filterByType = function(e) {
  this.props.actions.filterByType(e.value === 'UNDEFINED' ? null : e.value);
};

var _filterByName = function(e) {
  this.props.actions.filterByName(this.refs.nameFilter.getValue());
};

var GroupCatalog  = React.createClass({
  contextTypes: {
      intl: React.PropTypes.object
  },
  
  getInitialState: function() {
    return {
      draw: false
    };
  },
  
  componentWillMount : function() {
    if(this.props.groupCatalog.groups == null) {
      this.props.actions.getGroups();
    }
  },

  onPageIndexChange: function(index) {
    this.props.actions.changeIndex(index);
  },

  refresh: function(e) {
    this.props.actions.getGroups();
  },

  render: function() {
    const tableFields = [{
      name: 'id',
      title: 'Section.Groups.Table1.Id',
      hidden: true
    }, {
      name: 'type',
      title: 'Section.Groups.Table1.Type',
      width: 100
    }, {
      name: 'text',
      title: 'Section.Groups.Table1.Name',
      link: function(row) {
        if(row.key) {
          return '/group/{key}/';
        }
        return null;
      }
    }, {
      name: 'size',
      title: 'Section.Groups.Table1.NumberOfMembers'
    }, {
      name: 'createdOn',
      title: 'Section.Groups.Table1.UpdatedOn',
      type: 'datetime'
    }, {
      name : 'favorite',
      type : 'action',
      icon : function(field, row) {
        if(row.type === 'SET'){
          return (row.favorite ? 'star' : 'star-o');
        } else {
          return null;
        }
      },
      handler : (function(field, row) {
        if(row.favorite) {
          this.props.actions.removeFavorite(row.key);
        } else {
          this.props.actions.addFavorite(row.key);
        }
      }).bind(this),
      visible : (function(field, row) {
        return (row.type == 'SET');
      }).bind(this)
    }, {
      name : 'chart',
      type : 'action',
      icon : 'bar-chart-o',
      handler : (function(field, row) {
        var utility = this.props.profile.utility;

        var population;
        if(row.type === 'SEGMENT'){
          var clusterKey = this.props.config.utility.clusters.filter((cluster) => cluster.name == row.cluster);
          population = [{group: row.key, label:"CLUSTER:" + clusterKey[0].key + ":" + row.key, type:"GROUP"}];
          this.props.actions.getGroupChart(population, utility.key, utility.name, utility.timezone);      
          this.setState({draw:true});
          
        } else if(row.type === 'SET'){
        
          population = [{group: row.key, label:"GROUP:" + row.key + '/' + row.name, type:"GROUP"}];
          this.props.actions.getGroupChart(population, utility.key, utility.name, utility.timezone); 
          this.setState({draw:true});
        }
      }).bind(this)
    }, {
      name : 'delete',
      type : 'action',
      icon : function(field, row) {
        return (row.type == 'SET' ? 'remove' : null);
      },
      handler : (function(field, row) {
        if(row.type == 'SET') {
          this.props.actions.deleteGroup(row.key);
        }
      }).bind(this),
      visible : (function(field, row) {
        return (row.type == 'SET');
      }).bind(this)
    
    }];
    
    const tableData = this.props.groupCatalog.data.filtered || [];
    
    const tablePager = {
      index: 0,
      size: 10,
      //count: this.props.groupCatalog.data.filtered.length || 0,
      //onPageIndexChange: this.onPageIndexChange,
    };
    const tableSorter = {
      defaultSort: 'size',
      defaultOrder: 'desc'
    }; 

    const tableStyle = {
      row : {
        height: 50
      }
    };

    var resetButton = ( <div />);

    if((this.props.groupCatalog.query.text) ||
       (this.props.groupCatalog.query.serial)) {
      resetButton = (
        <div style={{float: 'right', marginLeft: 20}}>
          <Bootstrap.Button bsStyle='default' onClick={this.clearFilter}>Reset</Bootstrap.Button>
        </div>
      );
    }

    const filterOptions = (
      <Bootstrap.ListGroupItem>
        <div className="row">
          <div className='col-md-3'>
            <Select name='groupType'
                    value={this.props.groupCatalog.query.type || 'UNDEFINED'}
                    options={[
                      { value: 'UNDEFINED', label: '-' },
                      { value: 'SEGMENT', label: 'Group' },
                      { value: 'SET', label: 'Set' }
                    ]}
                    onChange={_filterByType.bind(this)}
                    clearable={false}
                    searchable={false} className='form-group'/>
            <span className='help-block'>Filter group type</span>
          </div>
          <div className="col-md-3">
            <Bootstrap.Input
              type='text'
               id='nameFilter' name='nameFilter' ref='nameFilter'
               placeholder='Name ...'
               onChange={_filterByName.bind(this)}
               onKeyPress={_handleKeyPress.bind(this)}
               value={this.props.groupCatalog.query.name || ''} />
              <span className='help-block'>Filter by name</span>
          </div>
          <div className="col-md-4" style={{float: 'right'}}>
            {resetButton}
            <div style={{float: 'right'}}>
              <Bootstrap.Button bsStyle='primary' onClick={this.refresh}>Refresh</Bootstrap.Button>
            </div>
          </div>
        </div>
      </Bootstrap.ListGroupItem>
    );

    const chartViewOptions = (
      <Bootstrap.ListGroupItem>
        <div className="row">
          <div className='col-md-3'>
            <Select name='chartMetric'
                    value={this.props.groupCatalog.metric}
                    options={[
                      { value: 'SUM', label: 'Total' },
                      { value: 'AVERAGE', label: 'Average' },
                      { value: 'MIN', label: 'Min' },
                      { value: 'MAX', label: 'Max' }
                    ]}
                    onChange={_setChartMetric.bind(this)}
                    clearable={false}
                    searchable={false} className='form-group'/>
            <span className='help-block'>Select value to display ....</span>
          </div>
        </div>
      </Bootstrap.ListGroupItem>
    );

    const dataNotFound = (
        <span>{ this.props.groupCatalog.isLoading ? 'Loading data ...' : 'No data found.' }</span>
    );

    const filterTitle = (
      <span>
        <i className='fa fa-search fa-fw'></i>
        <span style={{ paddingLeft: 4 }}>Search</span>
        <span style={{float: 'right',  marginTop: -3, marginLeft: 5 }}></span>
      </span>
    );

    var chartTitleText, chart = (<span>Select a group ...</span>);

    if(!Object.keys(this.props.groupCatalog.charts).length) {
      chartTitleText = (
        <span>
        <i className='fa fa-bar-chart fa-fw'></i>
        <span style={{ paddingLeft: 4 }}>Consumption - Last 30 days</span>
        </span>
      );
    } else {
      chartTitleText = (
        <span>
          <span>
            <i className='fa fa-bar-chart fa-fw'></i>
            <span style={{ paddingLeft: 4 }}>Consumption - Last 30 days</span>
          </span>
          <span style={{float: 'right',  marginTop: -3, marginLeft: 5 }}>
            <Bootstrap.Button bsStyle='default' className='btn-circle' onClick={_clearChart.bind(this)} >
              <i className='fa fa-remove fa-fw' ></i>
            </Bootstrap.Button>
          </span>
        </span>
      );
     
      var multipleSeries = [];
      for(var key in this.props.groupCatalog.charts) {
        var tempSeries = this.props.groupCatalog.charts[key].groupSeries;

        if(tempSeries){
          multipleSeries.push(tempSeries);
        }
      }

      var defaults= {
        chartProps: {
          width: 780,
          height: 300,
        }
      };

      var fSeries = _.flatten(multipleSeries);

      var series = fSeries[0] ? fSeries : null;

      chart = (
        <Chart
          {...defaults.chartProps}
          draw={this.state.draw}
          field={"volume"}
          level={"week"}
          reportName={"avg-daily-avg"}
          finished={this.props.groupCatalog.groupFinished}
          series={series}
          context={this.props.config}
          overlap={null}
          overlapping={false}
        />
      ); 
    }

    return (
      <div className="container-fluid" style={{ paddingTop: 10 }}>
        <div className="row">
          <div className="col-md-12">
            <Bootstrap.Panel header={filterTitle}>
              <Bootstrap.ListGroup fill>
                {filterOptions}
                <Bootstrap.ListGroupItem>
                  <Table
                    sortable 
                    fields={tableFields}
                    data={tableData}
                    pager={tablePager} 
                    sorter={tableSorter}
                    template={{ empty: dataNotFound }}
                    style={tableStyle}
                  />
                </Bootstrap.ListGroupItem>
                <Bootstrap.ListGroupItem style={{background : '#f5f5f5'}}>
                  {chartTitleText}
                </Bootstrap.ListGroupItem>
                <Bootstrap.ListGroupItem>
                  {chartViewOptions}
                </Bootstrap.ListGroupItem>
                <Bootstrap.ListGroupItem>
                  {chart}
                </Bootstrap.ListGroupItem>
              </Bootstrap.ListGroup>
            </Bootstrap.Panel>
          </div>
        </div>
      </div>
    );
  }
});

GroupCatalog.icon = 'group';
GroupCatalog.title = 'Section.Groups.Title';

function mapStateToProps(state) {
  return {
      groupCatalog: state.groupCatalog,
      profile: state.session.profile,
      routing: state.routing,
      config: state.config
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions : bindActionCreators(
      Object.assign({}, {getGroups, changeIndex, deleteGroup, getGroupChart, 
                         clearChart, setChartMetric, removeFavorite, addFavorite,
                         filterByType, filterByName, clearFilter }) , dispatch
  )};
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(GroupCatalog);
