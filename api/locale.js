var api = require('./base');

var LocaleAPI = {
	fetchMessages: function(locale) {
		return api.json('/assets/js/utility/i18n/' + locale + '.js');
	}
};

module.exports = LocaleAPI;
