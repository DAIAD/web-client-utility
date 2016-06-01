
var React = require('react');
var ReactDOM = require('react-dom');
var {syncHistoryWithStore} = require('react-router-redux');

var history = require('./routing/history');
var configureStore = require('./store/configureStore');

var Root = require('./containers/Root');

var {setLocale} = require('./actions/LocaleActions');
var {refreshProfile} = require('./actions/SessionActions');
var {configure} = require('./actions/config');

var store = configureStore(history);
history = syncHistoryWithStore(history, store);

var renderRoot = function() {
	ReactDOM.render(
		<Root store={store} history={history} />,
		document.getElementById('root')
	);
};

// http://stackoverflow.com/questions/10730362/get-cookie-by-name
var getCookie = function(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) {
    return parts.pop().split(";").shift();
  }
};

var locale = getCookie('daiad-utility-locale') || 'en';
var mustRefresh = (getCookie('daiad-utility-session') === 'true') || false;

// Chain preliminary actions needed before rendering

store.dispatch(setLocale(locale, true))
.then(() => (mustRefresh? store.dispatch(refreshProfile()) : Promise.resolve()))
.then(() => store.dispatch(configure()))
.then(renderRoot);

