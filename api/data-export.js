var api = require('./base');

var DataExportAPI = {

  getFiles : function(query = { index: 0, size: 10} ) {
    return api.json('/action/export/files', {
      query : query
    });
  }

};

module.exports = DataExportAPI;
