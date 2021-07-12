var React = require('react');
var { bindActionCreators } = require('redux');
var { connect } = require('react-redux');
var ScrollToTop = require('react-scroll-up');
var _ = require('lodash');

var LoginForm = require('../components/LoginForm');
var LocaleSwitcher = require('../components/LocaleSwitcher');

var { login, logout } = require('../actions/SessionActions');
var { resize } = require('../actions/ViewportActions');
var { setLocale } = require('../actions/LocaleActions');
var { configure } = require('../actions/config');
var NavigationTree = require('../components/NavigationTree');

var ContentRoot = React.createClass({
  contextTypes: {
    intl: React.PropTypes.object
  },

  getLogo() {
    const { profile = null } = this.props;
    console.log(this.props.profile);
    if (profile != null && profile.utility.logo) {
      console.log(this.props.profile.utility);
      return `data:image/png;base64,${profile.utility.logo}`;
    }

    return '/assets/images/shared/daiad-logo.svg';
  },

  render: function () {
    return (
      !this.props.isAuthenticated ? (
        <div className='login-wrapper'>
          <nav className='navbar navbar-default navbar-fixed-top'>
            <div className='navbar-header' style={{ paddingLeft: 15 }} >
              <a className='navbar-brand' href='#' style={{ padding: 0, margin: 0 }}>
                <img alt='DAIAD' src={this.getLogo()} style={{ marginTop: 15, maxHeight: 32 }} />
              </a>
            </div>
            <div style={{ float: 'right', marginTop: 8, marginLeft: 10, paddingRight: 15 }}>
              <LocaleSwitcher locale={this.props.locale} onLocaleSwitch={this.props.actions.setLocale} />
            </div>
          </nav>
          <div>
            <LoginForm
              action='login'
              isAuthenticated={this.props.isAuthenticated}
              errors={this.props.errors}
              onLogin={this.props.actions.login}
              isLoading={this.props.isLoading}
            />
          </div>
        </div>
      ) : (
        <div className='wrapper'>
          <nav className='navbar navbar-default navbar-fixed-top'>
            <div className='navbar-header' style={{ paddingLeft: 15 }} >
              <a className='navbar-brand' href='#' style={{ padding: 0, margin: 0 }}>
                <img alt='DAIAD' src={this.getLogo()} style={{ marginTop: 15, maxHeight: 32 }} />
              </a>
            </div>
            <div style={{ float: 'right', marginTop: 12, marginLeft: 10, paddingRight: 45 }}>
              <span style={{ marginRight: 10 }}>
                {this.props.username}
              </span>
              <i className='fa fa-sign-out fa-fw' style={{ color: '#d9534f', cursor: 'pointer' }} onClick={this.props.actions.logout}></i>
            </div>
            <NavigationTree roles={this.props.roles} height={this.props.viewport.height} />
          </nav>
          <div className='page-wrapper'>
            {
              this.props.children
            }
          </div>
          <ScrollToTop showUnder={160}>
            <div style={{ marginRight: -30 }}>
              <i className='fa fa-arrow-up fa-2x fa-fw' style={{ color: '#337ab7' }}></i>
            </div>
          </ScrollToTop>
        </div>
      )
    );
  },

  componentDidMount: function () {
    if (this.props.isAuthenticated) {
      this.props.actions.configure();
    }

    this.viewportListener = _.debounce(this.setViewport, 100, { maxWait: 1000 });
    window.addEventListener('resize', this.viewportListener);
  },

  componentWillUnmount: function () {
    window.removeEventListener('resize', this.viewportListener);
  },

  setViewport: function () {
    this.props.actions.resize(document.documentElement.clientWidth, document.documentElement.clientHeight);
  },

  componentDidUpdate: function (prevProps, prevState) {

    // Detect a successful login, and try to configure the client side.
    // This usually includes requesting configuration parts from the server side.
    if (!prevProps.isAuthenticated && this.props.isAuthenticated) {
      this.props.actions.configure();
    }

    // Todo On a successful logout, we should probably reset the client configuration
    // (if the configuration holds any security-sensitive parts).
  },

});

function mapStateToProps(state) {
  return {
    isAuthenticated: state.session.isAuthenticated,
    errors: state.session.errors,
    isLoading: state.session.isLoading,
    profile: state.session.profile,
    username: state.session.profile ? state.session.profile.username : null,
    roles: state.session.roles,
    viewport: state.viewport,
    routing: state.routing
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(
      Object.assign({}, { login, logout, setLocale, configure, resize }),
      dispatch
    )
  };
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(ContentRoot);
