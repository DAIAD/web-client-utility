var schedulerAPI = require('../api/scheduler');
var types = require('../constants/SchedulerActionTypes');

var jobChangeIndex = function(index) {
  return {
    type : types.JOB_CHANGE_INDEX,
    index : index
  };
};

var jobRequestInitialize = function() {
  return {
    type : types.JOB_REQUEST
  };
};

var jobRequestSuccess = function(response) {
  return {
    type : types.JOB_RESPONSE,
    success : true,
    errors : response.errors,
    total : response.total,
    items : response.jobs,
    index : response.index,
    size : response.size
  };
};

var jobRequestFailure = function(errors) {
  return {
    type : types.JOB_RESPONSE,
    success : false,
    errors : errors,
    total : 0,
    items : [],
    index : 0,
    size : 0
  };
};

var executionChangeIndex = function(index) {
  return {
    type : types.EXECUTION_CHANGE_INDEX,
    index : index
  };
};

var executionRequestInitialize = function() {
  return {
    type : types.EXECUTION_REQUEST
  };
};

var executionRequestSuccess = function(response) {
  return {
    type : types.EXECUTION_RESPONSE,
    success : true,
    errors : response.errors,
    total : response.total,
    items : response.executions,
    index : response.index,
    size : response.size
  };
};

var executionRequestFailure = function(errors) {
  return {
    type : types.EXECUTION_RESPONSE,
    success : false,
    errors : errors,
    total : 0,
    items : [],
    index : 0,
    size : 0
  };
};

var executionFilterByJobName = function(jobName) {
  return {
    type : types.EXECUTION_FILTER_JOB_NAME,
    jobName : (jobName === 'UNDEFINED' ? null : jobName)
  };
};

var executionFilterByExitCode = function(exitCode) {
  return {
    type : types.EXECUTION_FILTER_EXIT_CODE,
    exitCode : exitCode
  };
};

var executionClearFilter = function() {
  return {
    type : types.EXECUTION_FILTER_CLEAR
  };
};

var enableJobInitialize = function() {
  return {
    type : types.JOB_ENABLE_REQUEST
  };
};

var enableJobComplete = function(success, errors) {
  return {
    type : types.JOB_ENABLE_RESPONSE,
    success : success,
    errors : errors
  };
};

var disableJobInitialize = function() {
  return {
    type : types.JOB_DISABLE_REQUEST
  };
};

var disableJobComplete = function(success, errors) {
  return {
    type : types.JOB_DISABLE_RESPONSE,
    success : success,
    errors : errors
  };
};

var launchJobInitialize = function() {
  return {
    type : types.JOB_LAUNCH_REQUEST
  };
};

var launchJobComplete = function(success, errors) {
  return {
    type : types.JOB_LAUNCH_RESPONSE,
    success : success,
    errors : errors
  };
};

var _getExecutions = function(dispatch, getState) {
  dispatch(executionRequestInitialize());

  return schedulerAPI.getExecutions(getState().scheduler.query.execution).then(
      function(response) {
        dispatch(executionRequestSuccess(response));
      }, function(errors) {
        dispatch(executionRequestFailure(errors));
      });
};

var _getJobs = function(dispatch, getState) {
  dispatch(jobRequestInitialize());

  return schedulerAPI.getJobs().then(function(response) {
    dispatch(jobRequestSuccess(response));

    return _getExecutions(dispatch, getState);
  }, function(errors) {
    dispatch(jobRequestFailure(errors));
  });
};

var SchedulerActions = {

  launchJob : function(jobId) {
    return function(dispatch, getState) {
      dispatch(launchJobInitialize());

      return schedulerAPI.launchJob(jobId).then(function(response) {
        dispatch(launchJobComplete(response.success, response.errors));

        if (response.success) {
          return _getJobs(dispatch, getState);
        }
      }, function(error) {
        dispatch(launchJobComplete(false, error));
      });
    };
  },

  disableJob : function(jobId) {
    return function(dispatch, getState) {
      dispatch(disableJobInitialize());

      return schedulerAPI.disableJob(jobId).then(function(response) {
        dispatch(disableJobComplete(response.success, response.errors));

        if (response.success) {
          return _getJobs(dispatch, getState);
        }
      }, function(error) {
        dispatch(disableJobComplete(false, error));
      });
    };
  },

  enableJob : function(jobId) {
    return function(dispatch, getState) {
      dispatch(enableJobInitialize());

      return schedulerAPI.enableJob(jobId).then(function(response) {
        dispatch(enableJobComplete(response.success, response.errors));

        if (response.success) {
          return _getJobs(dispatch, getState);
        }
      }, function(error) {
        dispatch(enableJobComplete(false, error));
      });
    };
  },

  jobChangeIndex : function(index) {
    return jobChangeIndex(index);
  },

  getJobs : function() {
    return function(dispatch, getState) {
      return _getJobs(dispatch, getState);
    };
  },

  executionChangeIndex : function(index) {
    return function(dispatch, getState) {
      dispatch(executionChangeIndex(index));

      return _getExecutions(dispatch, getState);
    };
  },

  getExecutions : function() {
    return function(dispatch, getState) {
      dispatch(executionRequestInitialize());

      return _getExecutions(dispatch, getState);
    };
  },

  filterExecutionByJobName : function(jobName) {
    return function(dispatch, getState) {
      dispatch(executionFilterByJobName(jobName));

      dispatch(executionRequestInitialize());

      return _getExecutions(dispatch, getState);
    };
  },

  filterExecutionByExitCode : function(exitCode) {
    return function(dispatch, getState) {
      dispatch(executionFilterByExitCode(exitCode));

      dispatch(executionRequestInitialize());

      return _getExecutions(dispatch, getState);
    };
  },

  clearExecutionFilter : function() {
    return function(dispatch, getState) {
      dispatch(executionClearFilter());

      dispatch(executionRequestInitialize());

      return _getExecutions(dispatch, getState);
    };
  }

};

module.exports = SchedulerActions;
