var React = require('react');
var { bindActionCreators } = require('redux');
var { connect } = require('react-redux');
var Bootstrap = require('react-bootstrap');
var { Link } = require('react-router');
var Breadcrumb = require('../Breadcrumb');
var Select = require('react-select');
var DateRangePicker = require('react-bootstrap-daterangepicker');
var UserSearchTextBox = require('../UserSearchTextBox');
var Chart = require('../reports-measurements/chart');
var population = require('../../model/population');

var { setUser, setGroup, setInterval, getUtilityChart, getUserChart, 
      filterByType, getGroups, addFavourite} = require('../../actions/ForecastingActions');
      
      
var _filterByType = function(e) {
  var profile = this.props.profile;
  this.props.actions.filterByType(e.value === 'UNDEFINED' ? null : e.value);
  if(e.value === 'UTILITY'){
    this.props.actions.getUtilityChart(null, profile.utility.key, profile.utility.name, profile.timezone);
  }
  this.setState({isFavourite:false});
};

var _groupSelect = function(e) {

  var profile = this.props.profile;
  this.props.actions.setGroup(e);
  var population;
  if(e.group.type === 'SEGMENT'){
    
    var clusterKey = this.props.config.utility.clusters.filter((cluster) => cluster.name == e.group.cluster);
    population = [{group: e.group.key, label:"CLUSTER:" + clusterKey[0].key + ":" + e.group.key, type:"GROUP"}];
    this.props.actions.getUtilityChart(population, profile.utility.key, profile.utility.name, profile.timezone);
    
  } else if (e.group.type === 'SET') {
  
    population = [{group: e.group.key, label:"GROUP:" + e.group.key + '/' + e.name, type:"GROUP"}];
    this.props.actions.getUtilityChart(population, profile.utility.key, profile.utility.name, profile.timezone);
  }
  
  this.setState({isFavourite:false});
};

var _onUserSelect= function(e) {
  var profile = this.props.profile;
  if(e) {
    if(e.value) {
      this.props.actions.getUserChart(e.value, e.label, profile.timezone);
    }
  }
  this.props.actions.setUser(e);
};

var Forecasting = React.createClass({
  contextTypes: {
      intl: React.PropTypes.object
  },
  
  getInitialState() {
    return {
      isFavourite: false,
    };
  },
  
  toggleView(view) {
    this.setState({map : !this.state.map});
  },

  componentWillMount : function() {
  
    var profile = this.props.profile;
    this.props.actions.setUser(null);
    if(this.props.forecasting.query == null){
      //this.props.actions.filterByType('UTILITY');
      this.props.actions.getUtilityChart(null, profile.utility.key, profile.utility.name, profile.timezone);
    }
    if(this.props.forecasting.groups == null) {
      this.props.actions.getGroups();
    }    
  },
  
  _onIntervalChange : function (event, picker) {
    if(_.isEqual([picker.startDate, picker.endDate], this.props.forecasting.interval)){
      return;
    }
    
    this.props.actions.setInterval([picker.startDate, picker.endDate]);
    
    var profile = this.props.profile;
    var group = null;
    var q = this.props.forecasting.query;
    
    var groupType = q.queries[0].population[0].type;

    if(groupType === 'UTILITY'){
      group = null;
      this.props.actions.getUtilityChart(null, profile.utility.key, profile.utility.name, profile.timezone);
    } else if(groupType === 'GROUP'){
      var [g, r] =  population.fromString(q.queries[0].population[0].label);
      if(!g.clusterKey){
        group = [{group: g.key, label:"GROUP:" + g.key + '/' + q.title, type:"GROUP"}];
        this.props.actions.getUtilityChart(group, profile.utility.key, profile.utility.name, profile.timezone);

      } else {
        group = [{group: g.key, label:"CLUSTER:" + g.clusterKey + ":" + g.key, type:"GROUP"}];
        this.props.actions.getUtilityChart(group, profile.utility.key, profile.utility.name, profile.timezone);
      }
    } 
    
    if(this.props.forecasting.user){
      this.props.actions.getUserChart(this.props.forecasting.user.value, this.props.forecasting.user.label, profile.timezone);
    }
  },

  _addFavourite: function() {
    var namedQuery = this.props.forecasting.query;
    namedQuery.type = 'Forecast';
    namedQuery.reportName='sum';
    namedQuery.field='volume';
    namedQuery.level='week';

    var request;
    if(this.props.forecasting.populationType){
      namedQuery.title = 'Forecast - ' + this.props.forecasting.group.label + ' from ' +  this.props.forecasting.interval[0].format('DD/MM/YYYY') + ' to ' + this.props.forecasting.interval[1].format('DD/MM/YYYY');
      request =  {
        'namedQuery' : namedQuery
      };
      this.props.actions.addFavourite(request);
    } else {
      namedQuery.title = 'Forecast - Utility from ' + this.props.forecasting.interval[0].format('DD/MM/YYYY') + ' to ' + this.props.forecasting.interval[1].format('DD/MM/YYYY');
      request =  {
        'namedQuery' : namedQuery
      };
      this.props.actions.addFavourite(request);
    }
    this.setState({isFavourite:true});
  },
  
  render: function() {

    var defaults= {
      chartProps: {
        width: 780,
        height: 300,
      }
    };

    var favIcon = this.state.isFavourite ? 'star' : 'star-o';
    const title = (
      <span>
        <span>
          <i className={'fa fa-bar-chart fa-fw'}></i>
          <span style={{ paddingLeft: 4 }}>Water Consumption Forecasting</span>
        </span>
        <span style={{float: 'right',  marginTop: -3, marginLeft: 5}}>
          <Bootstrap.Button bsStyle='default' className='btn-circle' onClick={this._addFavourite}>
            <i className={'fa fa-' + favIcon + ' fa-fw'}></i>
          </Bootstrap.Button>
        </span>
      </span>
    );

    var chart1 = (
        <Bootstrap.ListGroup fill>
          <Bootstrap.ListGroupItem className="report-chart-wrapper">       
            <Chart
              {...defaults.chartProps}
              draw={this.props.forecasting.groupDraw}
              field={"volume"}
              level={"week"}
              reportName={"sum"}
              finished={this.props.forecasting.groupFinished}
              series={this.props.forecasting.groupSeries}
              context={this.props.config}
              overlap={null}
              overlapping={false}
              forecast={this.props.forecasting.group ? this.props.forecasting.group : null}
            />
          </Bootstrap.ListGroupItem>
        </Bootstrap.ListGroup>
      );
     
      var chart2 = (
        <Bootstrap.ListGroup fill>
          <Bootstrap.ListGroupItem className="report-chart-wrapper">       
            <Chart
              {...defaults.chartProps}
              draw={this.props.forecasting.userDraw}
              field={"volume"}
              level={"week"}
              reportName={"sum"}
              finished={this.props.forecasting.userFinished}
              series={this.props.forecasting.userSeries}
              context={this.props.config}
              overlap={null}
              overlapping={false}   
              forecast={this.props.forecasting.user ? this.props.forecasting.user : null}
            />
          </Bootstrap.ListGroupItem>
        </Bootstrap.ListGroup>
      );

    var typeOptions = [];
    if(this.props.forecasting.groups && this.props.forecasting.populationType){
      typeOptions = this.props.forecasting.groups.filtered.map((group) => {
        return {
          name: group.name,
          label: group.type == 'SEGMENT' ? group.cluster + ' ' + group.name : group.name,
          group: group
        };
      });
    }
    
    var intervalLabel = '';
    if(this.props.forecasting.interval.length>0) {
      var start = this.props.forecasting.interval[0].format('DD/MM/YYYY');
      
      var end = this.props.forecasting.interval[1].format('DD/MM/YYYY');

      intervalLabel = start + ' - ' + end;
      if (start === end) {
        intervalLabel = start;
      }
    }
    var groupTypeSelect = (
      <div>
        <Select name='groupType'
          value={this.props.forecasting.populationType ? this.props.forecasting.populationType : 'UNDEFINED'}
          options={[
            { value: 'UNDEFINED', label: this.props.profile.utility.name },
            { value: 'SEGMENT', label: 'Segment' },
            { value: 'SET', label: 'Set' }
          ]}
          onChange={_filterByType.bind(this)}
          clearable={false}
          searchable={false} className='form-group'/>
        <span className='help-block'>Filter group type</span>
    </div>
  );
 
  var groupSelect = (
    <div>
      <Select name='group'
        value={this.props.forecasting.group ? 
        {name:this.props.forecasting.group.name,label:this.props.forecasting.group.label} : 'UNDEFINED'}
        options={typeOptions}
        onChange={_groupSelect.bind(this)}
        clearable={false}
        searchable={false} className='form-group'/>
      <span className='help-block'>Select group</span>
    </div>
  );
    
    var intervalEditor = (
      <div>
        <DateRangePicker
          startDate={this.props.forecasting.interval[0]}
          endDate={this.props.forecasting.interval[1]}
          ranges={this.props.forecasting.ranges}
          onEvent={this._onIntervalChange}
        >
          <div className='clearfix Select-control' style={{ cursor: 'pointer', padding: '5px 10px', width: '100%'}}>
            <span>{intervalLabel}</span>
          </div>
          </DateRangePicker>
         <div style={{padding: '10px'}}>
          <span className='help-block'>Select time interval</span>
         </div>
      </div>
    );
   
    var content = (
      <div className='row'>
        <div className='col-lg-12'>
          <Bootstrap.Panel header={title}>
            <Bootstrap.ListGroup fill>
              <Bootstrap.ListGroupItem>
                <div className='row'>
                  <div className='col-md-3'>
                    {groupTypeSelect}
                  </div>
                  <div className='col-md-3' >
                    {groupSelect}
                  </div>
                  <div className='col-md-3'>
                    {intervalEditor}
                  </div>
                </div>
              </Bootstrap.ListGroupItem>
              <Bootstrap.ListGroupItem>
                {chart1}
              </Bootstrap.ListGroupItem>
             <Bootstrap.ListGroupItem>
             <div className='row'>
                  <div className='col-md-3'>
                    <UserSearchTextBox name='username' 
                      noResults={'Type a username...'}
                      onChange={_onUserSelect.bind(this)}/>
                    <span className='help-block'>Select a single user</span>
                  </div>
                 </div>
                </Bootstrap.ListGroupItem>
              {chart2}
              <Bootstrap.ListGroupItem className='clearfix'>
                <Link className='pull-right' to='/scheduler' style={{ paddingLeft : 7, paddingTop: 12 }}>Job Scheduler</Link>
              </Bootstrap.ListGroupItem>
            </Bootstrap.ListGroup>
          </Bootstrap.Panel>
        </div>
      </div>
    );

    return (
      <div className='container-fluid' style={{ paddingTop: 10 }}>
        <div className='row'>
          <div className='col-md-12'>
            <Breadcrumb routes={this.props.routes}/>
          </div>
        </div>
        {content}
      </div>
     );
  }
});

Forecasting.icon = 'line-chart';
Forecasting.title = 'Section.Forecasting';

function mapStateToProps(state) {
  return {
      forecasting: state.forecasting,
      profile: state.session.profile,
      routing: state.routing,
      config: state.config
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions : bindActionCreators(Object.assign({}, { setUser, setGroup, setInterval, getUtilityChart, getUserChart, 
                                                     filterByType, getGroups, addFavourite }) , dispatch)
  };
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(Forecasting);
