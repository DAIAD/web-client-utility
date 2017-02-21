var React = require('react');
var { bindActionCreators } = require('redux');
var { connect } = require('react-redux');
var Bootstrap = require('react-bootstrap');
var { Link } = require('react-router');
var Breadcrumb = require('../Breadcrumb');
var Select = require('react-select');
var UserSearchTextBox = require('../UserSearchTextBox');
var Chart = require('../reports-measurements/chart');

var { getUtilityData, getUtilityForecast, getUserData, 
      getUserForecast, setUser, setGroup, getUtilityChart, getUserChart, 
      filterByType, getGroups} = require('../../actions/ForecastingActions');
      
      
var _filterByType = function(e) {

  var profile = this.props.profile;
  this.props.actions.filterByType(e.value === 'UNDEFINED' ? null : e.value);
  if(e.value === 'UNDEFINED'){
    this.props.actions.getUtilityChart(null, profile.utility.key, profile.utility.name, profile.timezone);
  }
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

  toggleView(view) {
    this.setState({map : !this.state.map});
  },

  componentWillMount : function() {
  
    var profile = this.props.profile;
    this.props.actions.setUser(null);

    this.props.actions.getUtilityChart(null, profile.utility.key, profile.utility.name, profile.timezone);
    
    if(this.props.forecasting.groups == null) {
      this.props.actions.getGroups();
    }    
  },

  render: function() {

    var defaults= {
      chartProps: {
        width: 780,
        height: 300,
      }
    };

    const title = (
      <span>
        <i className={'fa fa-bar-chart fa-fw'}></i>
        <span style={{ paddingLeft: 4 }}>Water Consumption Forecasting</span>
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
              reportName={"avg-daily-avg"}
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
              reportName={"avg-daily-avg"}
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
    if(this.props.forecasting.groups && this.props.forecasting.query.type){
      typeOptions = this.props.forecasting.groups.filtered.map((group) => {
        return {
          name: group.name,
          label: group.type == 'SEGMENT' ? group.cluster + ' ' + group.name : group.name,
          group: group
        };
      });
    }
    
    var content = (
      <div className='row'>
        <div className='col-lg-12'>
          <Bootstrap.Panel header={title}>
            <Bootstrap.ListGroup fill>
              <Bootstrap.ListGroupItem>
                <div className='row'>
                  <div className='col-md-3'>
                    <Select name='groupType'
                      value={this.props.forecasting.query.type ? this.props.forecasting.query.type : 'UNDEFINED'}
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
                  <div className='col-md-3'>
                    <Select name='group'
                      value={this.props.forecasting.group ? 
                          {name:this.props.forecasting.group.name,label:this.props.forecasting.group.label} : 'UNDEFINED'}
                      options={typeOptions}
                      onChange={_groupSelect.bind(this)}
                      clearable={false}
                      searchable={false} className='form-group'/>
                    <span className='help-block'>Select group</span>
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
    actions : bindActionCreators(Object.assign({}, { getUtilityData, getUtilityForecast,
                                                     getUserData, getUserForecast, setUser, 
                                                     setGroup, getUtilityChart, getUserChart, 
                                                     filterByType, getGroups }) , dispatch)
  };
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(Forecasting);
