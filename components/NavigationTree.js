const develop = (process.env.NODE_ENV !== 'production');

var React = require('react');
var {Link} = require('react-router');

var Collapsible = require('./Collapsible');
var {ROLE} = require('../constants/Constants');

var NavigationTree = React.createClass({
  contextTypes: {
      intl: React.PropTypes.object
  },

  propTypes : {
  },

  getDefaultProps: function() {
    return { };
  },

  getInitialState() {
    return {
      expand: {
        consumers: false,
        trials: false,
        support: false,
        analytics: false,
        alerts: false
      },
    };
  },

  _toggleExpand: function (itemKey) {
    this.setState((prevState) => {
      var expanded = prevState.expand;
      return {
        expand: Object.assign({}, expanded, {[itemKey]: !expanded[itemKey]})
      };
    });
  },

  render: function() {
    var _t = this.context.intl.formatMessage;

    var development = null;
    if(develop) {
      development = (
        <li>
          <Link to='/support/development'>
            <span  style={{paddingLeft: 18}}>
              <i className='fa fa-bug fa-fw'></i>{' ' + _t({ id: 'Section.Support.Development'})}
            </span>
          </Link>
        </li>
      );
    }

    var scheduler = null, log = null;
    if(this.props.roles.indexOf(ROLE.ROLE_SYSTEM_ADMIN) !== -1) {
      scheduler = (
        <li>
          <Link to='/scheduler'>
            <i className='fa fa-clock-o fa-fw'></i>{' ' + _t({ id: 'Section.Scheduler'})}
          </Link>
        </li>
      );

      log = (
        <li>
          <Link to='/support/logging'>
            <span  style={{paddingLeft: 18}}>
              <i className='fa fa-history fa-fw'></i>{' ' + _t({ id: 'Section.Support.Logging'})}
            </span>
          </Link>
        </li>
      );
    }

    return (
      <div className='navbar-default navbar-static-side' role='navigation'>
        <div className='sidebar-collapse'>
          <ul className='nav' id='side-menu'>
            <li>
              <Link to='/'>
                <i className='fa fa-dashboard fa-fw'></i>{' ' + _t({ id: 'Section.Dashboard'})}
              </Link>
            </li>
            <li>
              <a href='#' onClick={() => this._toggleExpand('analytics')}>
                <i className='fa fa-bar-chart fa-fw'></i>
                {' ' + _t({ id: 'Section.Analytics-Group'}) + ' '}
                { this.state.expand.analytics ? (<i className='fa fa-caret-up fa-fw'></i>) : (<i className='fa fa-caret-down fa-fw'></i>)}
              </a>
              <Collapsible open={this.state.expand.analytics}>
                <ul className='nav'>
                  <li>
                    <Link to='/analytics/panel'>
                      <span  style={{paddingLeft: 18}}>
                        <i className='fa fa-area-chart fa-fw'></i>{' ' + _t({ id: 'Section.Analytics.ReportPanel'})}
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link to='/analytics/map'>
                      <span  style={{paddingLeft: 18}}>
                        <i className='fa fa-map-o fa-fw'></i>{' ' + _t({ id: 'Section.Analytics.Maps'})}
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link to='/analytics/basic-reports'>
                      <span  style={{paddingLeft: 18}}>
                        <i className='fa fa-file-text fa-fw'></i>{' ' + _t({ id: 'Section.Analytics.BasicReports'})}
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link to='/analytics/fav'>
                      <span  style={{paddingLeft: 18}}>
                        <i className='fa fa-diamond fa-fw'></i>{' ' + _t({ id: 'Section.Analytics.Fav'})}
                      </span>
                    </Link>
                  </li>
                </ul>
              </Collapsible>
            </li>
            <li>
              <Link to='/forecasting'>
                <i className='fa fa-line-chart fa-fw'></i>{' ' + _t({ id: 'Section.Forecasting'})}
              </Link>
            </li>
            <li>
              <a href='#' onClick={() => this._toggleExpand('consumers')}>
                <i className='fa fa-home fa-fw'></i>
                {' ' + _t({ id: 'Section.Consumers'}) + ' '}
                { this.state.expand.consumers ? (<i className='fa fa-caret-up fa-fw'></i>) : (<i className='fa fa-caret-down fa-fw'></i>)}
              </a>
              <Collapsible open={this.state.expand.consumers}>
                <ul className='nav'>
                  <li>
                    <Link to='/users'>
                      <span  style={{paddingLeft: 18}}>
                        <i className='fa fa-user fa-fw'></i>{' ' + _t({ id: 'Section.Users'})}
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link to='/groups'>
                      <span  style={{paddingLeft: 18}}>
                        <i className='fa fa-group fa-fw'></i>{' ' + _t({ id: 'Section.Groups'})}
                      </span>
                    </Link>
                  </li>
                </ul>
              </Collapsible>
            </li>
            {scheduler}
            <li>
              <a href='#' onClick={() => this._toggleExpand('alerts')}>
                <i className='fa fa-commenting-o fa-fw'></i>
                {' ' + _t({ id: 'Section.ManageAlerts.Engagement'}) + ' '}
                { this.state.alerts ? (<i className='fa fa-caret-up fa-fw'></i>) : (<i className='fa fa-caret-down fa-fw'></i>)}
              </a>
              <Collapsible open={this.state.expand.alerts}>
                <ul className='nav'>
                  <li>
                    <Link to='/manage-alerts'>
                      <span  style={{paddingLeft: 18}}>
                        <i className='fa fa-list-ol fa-fw'></i>{' ' + _t({ id: 'Section.ManageAlerts.Messages'})}
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link to='/announcements'>
                      <span  style={{paddingLeft: 18}}>
                        <i className='fa fa-wechat fa-fw'></i>{' ' + _t({ id: 'Section.ManageAlerts.Announcements'})}
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link to='/savings'>
                      <span  style={{paddingLeft: 18}}>
                        <i className='fa fa-tint fa-fw'></i>{' ' + _t({ id: 'Section.Savings'})}
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link to='/budgets'>
                      <span  style={{paddingLeft: 18}}>
                        <i className='fa fa-pie-chart fa-fw'></i>{' ' + _t({ id: 'Section.Budgets'})}
                      </span>
                    </Link>
                  </li>
                </ul>
              </Collapsible>
            </li>
            <li>
              <a href='#' onClick={() => this._toggleExpand('trials')}>
                <i className='fa fa-flask fa-fw'></i>
                {' ' + _t({ id: 'Section.Trials.Group'}) + ' '}
                { this.state.expand.trials ? (<i className='fa fa-caret-up fa-fw'></i>) : (<i className='fa fa-caret-down fa-fw'></i>)}
              </a>
              <Collapsible open={this.state.expand.trials}>
                <ul className='nav'>
                  <li>
                    <Link to='/trials/overview'>
                      <span  style={{paddingLeft: 18}}>
                        <i className='fa fa-table fa-fw'></i>{' ' + _t({id: 'Section.Trials.Overview'})}
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link to='/trials/pilot-reports'>
                      <span  style={{paddingLeft: 18}}>
                        <i className='fa fa-pie-chart fa-fw'></i>{' ' + _t({id: 'Section.Trials.PilotReports'})}
                      </span>
                    </Link>
                  </li>
                </ul>
              </Collapsible>
            </li>
            <li>
              <a href='#' onClick={() => this._toggleExpand('support')}>
                <i className='fa fa-support fa-fw'></i>
                {' ' + _t({ id: 'Section.Support.Group'}) + ' '}
                { this.state.expand.support ? (<i className='fa fa-caret-up fa-fw'></i>) : (<i className='fa fa-caret-down fa-fw'></i>)}
              </a>
              <Collapsible open={this.state.expand.support}>
                <ul className='nav'>
                  {log}
                  <li>
                    <Link to='/mode/management'>
                      <span  style={{paddingLeft: 18}}>
                        <i className='fa fa-sliders fa-fw'></i>{' ' + _t({ id: 'Section.ModeManagement'})}
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link to='/support/data'>
                      <span  style={{paddingLeft: 18}}>
                        <i className='fa fa-database fa-fw'></i>{' ' + _t({ id: 'Section.Support.Data'})}
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link to='/support/export'>
                      <span  style={{paddingLeft: 18}}>
                        <i className='fa fa-cloud-download fa-fw'></i>{' ' + _t({ id: 'Section.Support.DataExport'})}
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link to='/support/messages'>
                      <span  style={{paddingLeft: 18}}>
                        <i className='fa fa-commenting fa-fw'></i>{' ' + _t({ id: 'Section.ManageAlerts.Messages'})}
                      </span>
                    </Link>
                  </li>
                  {development}
                </ul>
              </Collapsible>
            </li>
            <li>
              <Link to='/settings/user'>
                <i className='fa fa-user fa-fw'></i>{' ' + _t({ id: 'Settings.User'})}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    );
  }
});

module.exports = NavigationTree;
