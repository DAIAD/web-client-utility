var dataExportAPI = require('../api/data-export');
var types = require('../constants/DataExportActionTypes');

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

var fileRequestCompleteSuccess = function(response) {
  return {
    type : types.FILE_RESPONSE,
    success : response.success,
    errors: response.errors,
    files : {
      total: response.total,
      index: response.index,
      size: response.size,
      items: response.files
    }
  };
};

var fileRequestCompleteFailure = function(errors) {
  return {
    type : types.FILE_RESPONSE,
    success : false,
    errors : errors,
    files : null
  };
};

var trialFileRequestInitialize = function() {
  return {
    type : types.TRIAL_FILE_REQUEST
  };
};

var trialFileRequestCompleteSuccess = function(response) {
  return {
    type : types.TRIAL_FILE_RESPONSE,
    success : response.success,
    errors: response.errors,
    files : response.files
  };
};

var trialFileRequestCompleteFailure = function(errors) {
  return {
    type : types.TRIAL_FILE_RESPONSE,
    success : false,
    errors : errors,
    files : null
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
          dispatch(fileRequestCompleteSuccess(response));
        }, function(error) {
          dispatch(fileRequestCompleteFailure(error));
        });
    };
  },

  getFiles : function() {
    return function(dispatch, getState) {
      dispatch(fileRequestInitialize());

      return dataExportAPI.getFiles(getState().dataExport.query).then(
        function(response) {
          dispatch(fileRequestCompleteSuccess(response));
        }, function(error) {
          dispatch(fileRequestCompleteFailure(error));
        });
    };
  },

  getTrialFinalFiles : function() {
    return function(dispatch, getState) {
      dispatch(trialFileRequestInitialize());

      return dataExportAPI.getTrialFinalFiles().then(
        function(response) {
          dispatch(trialFileRequestCompleteSuccess(response));
        }, function(error) {
          dispatch(trialFileRequestCompleteFailure(error));
        });
    };
  },

  setFilter : function(filter) {
    return function(dispatch, getState) {
      dispatch(setFilter(filter));

      dispatch(fileRequestInitialize());

      return dataExportAPI.getFiles(getState().dataExport.query).then(
        function(response) {
          dispatch(fileRequestCompleteSuccess(response));
        }, function(error) {
          dispatch(fileRequestCompleteFailure(error));
        });
    };
  },

  clearFilter : function() {
    return function(dispatch, getState) {
      dispatch(clearFilter());

      dispatch(fileRequestInitialize());

      return dataExportAPI.getFiles(getState().dataExport.query).then(
        function(response) {
          dispatch(fileRequestCompleteSuccess(response));
        }, function(error) {
          dispatch(fileRequestCompleteFailure(error));
        });
    };
  },

  download : function(key, filename) {
    var link = document.createElement('a');
    link.href = `/action/export/download/${key}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return {
      type : types.FILE_DOWNLOAD_REQUEST,
      key : key,
      filename: filename
    };
  }

};

module.exports = DataExportActions;
