var api = require('./base');

var DataExportAPI = {

  getFiles : function(query = { } ) {
    return api.json('/action/export/files', {
      query : {
        ...query,
        type: 'DATA_EXPORT'
      }
    });
  },

  getTrialFinalFiles : function() {
    return api.json('/action/export/files', {
      query : {
        type: 'DATA_EXPORT_TRIAL'
      }
    });
  }

};

module.exports = DataExportAPI;
