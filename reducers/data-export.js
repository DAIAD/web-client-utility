var types = require('../constants/DataExportActionTypes');

var initialize = function() {
  return {
    isLoading : false,
    query : {
      index : 0,
      size : 10
    },
    files : {
      total : 0,
      index : 0,
      size : 10,
      items : null
    },
    pinnedFiles : []
  };
};

var processFiles = function(files) {
  files = files || [];

  return files.map( f => {
    var size = f.size.toString + 'b';

    if (f.size > 1048576) {
      size = (f.size / 1048576).toFixed(2) + ' mb';
    } else if (f.size > 1024) {
      size = (f.size / 1024).toFixed(2) + ' kb';
    }

    return {
      ...f,
      size: size
    };
  });
};

var reducer = function(state, action) {
  switch (action.type) {

    case types.FILE_CHANGE_INDEX:
      return {
        ...state,
        query: {
          ...state.query,
          index : (action.index < 0 ? 0 : action.index)
        }
      };

    case types.FILE_REQUEST:
      return {
        ...state,
        isLoading : true
      };

    case types.TRIAL_FILE_REQUEST:
      return {
        ...state,
        isLoading : true
      };

    case types.FILE_RESPONSE:
      return {
        ...state,
        isLoading : false,
        files: {
          ...action.files,
          items: processFiles(action.files.items)
        }
      };

    case types.TRIAL_FILE_RESPONSE:
      return {
        ...state,
        isLoading : false,
        pinnedFiles: processFiles(action.files)
      };

    case types.FILE_FILTER_SET:
      // No filters available
      return {
        ...state
      };

    case types.FILE_FILTER_CLEAR:
      return {
        ...state,
        query: {
          index : 0,
          size : 10
        }
    };

    case types.FILE_DOWNLOAD_REQUEST:
      // No action is required
      return {
        ...state
      };

    case types.USER_RECEIVED_LOGOUT:
      return initialize();

    default:
      return state || initialize();
  }
};

module.exports = reducer;
