
var types = require('../constants/ActionTypes');
var alertsAPI = require('../api/alerts');

var _setEditorValue = function(editor, value) {
  return {
    type : types.MESSAGES_SET_EDITOR_VALUE,
    editor : editor,
    value : value
  };
};

var requestedMessageStatistics = function () {
  return {
    type: types.MESSAGES_REQUESTED_STATISTICS
  };
};

var receivedMessageStatistics = function (success, errors, messageStatistics) {
  return {
    type: types.MESSAGES_RECEIVED_STATISTICS,
    success: success,
    errors: errors,
    messages: messageStatistics
  };
};

var requestedReceivers = function () {
  return {
    type: types.MESSAGES_REQUESTED_RECEIVERS
  };
};

var receivedReceivers = function (success, errors, receivers) {
  return {
    type: types.MESSAGES_RECEIVED_RECEIVERS,
    success: success,
    errors: errors,
    receivers: receivers
  };
};

var buildQuery = function(population, timezone, interval) {

  return {
    'query' : {
      'timezone' : timezone,
      'time' : {
        'type' : 'ABSOLUTE',
        'start' : interval[0].toDate().getTime(),
        'end' : interval[1].toDate().getTime()
      },
      'population' : [
        population
      ]
    }
  };
};

var changeIndex = function(index) {
  return {
    type : types.MESSAGES_INDEX_CHANGE,
    index : index
  };
};

var MessageAnalyticsActions = {

  changeIndex : function(index) {
    return changeIndex(index);
  },

  setEditor : function(key) {
    return {
      type : types.MESSAGES_SELECT_EDITOR,
      editor : key
    };
  },

  setEditorValue : function(editor, value) {
    return function(dispatch, getState) {
      dispatch(changeIndex(0));
      dispatch(_setEditorValue(editor, value));
      dispatch(requestedMessageStatistics());
      var query = buildQuery(getState(event).messages.population, getState(event).messages.timezone, getState(event).messages.interval);
      return alertsAPI.getMessageStatistics(query).then(function (response) {
        var messages = response.alertStatistics.concat(response.recommendationStatistics);
        dispatch(receivedMessageStatistics(response.success, response.errors, messages));
      }, function (error) {
        dispatch(receivedMessageStatistics(false, error, null));
      });
    };
  },

  setTimezone : function(timezone) {
    return {
      type : types.MESSAGES_SET_TIMEZONE,
      timezone : timezone
    };
  },

  fetchMessages: function (event) {
    return function (dispatch, getState) {
      dispatch(changeIndex(0));
      dispatch(requestedMessageStatistics());
      var query = buildQuery(getState(event).messages.population, getState(event).messages.timezone, getState(event).messages.interval);
      return alertsAPI.getMessageStatistics(query).then(function (response) {
        var messages = response.alertStatistics.map(value => {
          value.category = 'ALERT';
          return value;
        }).concat(response.recommendationStatistics.map(value => {
          value.category = 'RECOMMENDATION';
          return value;
        }));
        dispatch(receivedMessageStatistics(response.success, response.errors, messages));
      }, function (error) {
        dispatch(receivedMessageStatistics(false, error, null));
      });
    };
  },
  showReceivers: function (event) {
    return function (dispatch, getState) {
      dispatch(requestedReceivers());

      var message = getState(event).messages.selectedMessage;
      var query = buildQuery(getState(event).messages.population, getState(event).messages.timezone, getState(event).messages.interval);

      if(message.category == "ALERT"){

        return alertsAPI.getAlertReceivers(message.id, query).then(function (response) {
          dispatch(receivedReceivers(response.success, response.errors, response.receivers));
        }, function (error) {
          dispatch(receivedReceivers(false, error, null));
        });
      }
      else if(message.category == "RECOMMENDATION"){
        return alertsAPI.getRecommendationReceivers(message.id, query).then(function (response) {
          dispatch(receivedReceivers(response.success, response.errors, response.receivers));
        }, function (error) {
          dispatch(receivedReceivers(false, error, null));
        });
      }
    };
  },
  setSelectedMessage:function (message) {
    return {
      type : types.MESSAGES_SELECTED_MESSAGE,
      selectedMessage : message
    };

  },
  goBack : function(){
    return {
      type : types.MESSAGES_RETURN_BACK,
      showReceivers: false
    };
  }
};

module.exports = MessageAnalyticsActions;
