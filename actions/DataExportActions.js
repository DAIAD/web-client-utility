var dataExportAPI = require('../api/data-export');
var types = require('../constants/DataExportActionTypes');

//TODO : Remove jquery dependency
var $ = require('jquery');

var fileChangeIndex = function(index) {
  return {
    type : types.FILE_CHANGE_INDEX,
    index : index
  };
};

var fileRequestInitialize = function() {
  return {
    type : types.FILE_REQUEST
  };
};

var fileRequestComplete = function(success, errors, total, items, index, size) {
  return {
    type : types.FILE_RESPONSE,
    success,
    errors,
    files : {
      total,
      index,
      size,
      items
    }
  };
};

var setFilter = function(filter) {
  return {
    type : types.FILE_FILTER_SET
  };
};

var clearFilter = function() {
  return {
    type : types.FILE_FILTER_CLEAR
  };
};

var DataExportActions = {

  fileChangeIndex : function(index) {
    return function(dispatch, getState) {
      dispatch(fileChangeIndex(index));

      dispatch(fileRequestInitialize());

      return dataExportAPI.getFiles(getState().dataExport.query).then(
          function(response) {
            dispatch(fileRequestComplete(response.success,
                                         response.errors,
                                         response.total,
                                         response.files,
                                         response.index,
                                         response.size));
          }, function(error) {
            dispatch(fileRequestComplete(false, error));
          });
    };
  },

  getFiles : function() {
    return function(dispatch, getState) {
      dispatch(fileRequestInitialize());

      return dataExportAPI.getFiles(getState().dataExport.query).then(
          function(response) {
            dispatch(fileRequestComplete(response.success,
                                         response.errors,
                                         response.total,
                                         response.files,
                                         response.index,
                                         response.size));
          }, function(error) {
            dispatch(fileRequestComplete(false, error));
          });
    };
  },

  setFilter : function(filter) {
    return function(dispatch, getState) {
      dispatch(setFilter(filter));

      dispatch(fileRequestInitialize());

      return dataExportAPI.getFiles(getState().dataExport.query).then(
          function(response) {
            dispatch(fileRequestComplete(response.success,
                                         response.errors,
                                         response.total,
                                         response.files,
                                         response.index,
                                         response.size));
          }, function(error) {
            dispatch(fileRequestComplete(false, error));
          });
    };
  },

  clearFilter : function() {
    return function(dispatch, getState) {
      dispatch(clearFilter());

      dispatch(fileRequestInitialize());

      return dataExportAPI.getFiles(getState().dataExport.query).then(
          function(response) {
            dispatch(fileRequestComplete(response.success,
                                         response.errors,
                                         response.total,
                                         response.files,
                                         response.index,
                                         response.size));
          }, function(error) {
            dispatch(fileRequestComplete(false, error));
          });
    };
  },

  download : function(key) {
    var content = [], src = `/action/export/download/${key}`

    content.push('<div id="export-download-frame" style="display: none">');
    content.push('<iframe src="' + src + '"></iframe>');
    content.push('</div>');

    $('#export-download-frame').remove();
    $('body').append(content.join(''));

    return {
      type : types.FILE_DOWNLOAD_REQUEST,
      key : key
    };
  }

};

module.exports = DataExportActions;
