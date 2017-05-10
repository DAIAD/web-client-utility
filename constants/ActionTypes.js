var mirrorToPath = require('../helpers/path-mirror.js');

var types = mirrorToPath({
  
  LOCALE_CHANGE : null,
  LOCALE_REQUEST_MESSAGES: null,
  LOCALE_RECEIVED_MESSAGES: null,
  
  USER_REQUESTED_LOGIN: null,
  USER_RECEIVED_LOGIN: null,
  USER_REQUESTED_LOGOUT: null,
  USER_RECEIVED_LOGOUT: null,
  USER_PROFILE_REFRESH : null,
  USER_PROFILE_UPDATE: null,

  PASSWORD_CAPTCHA_SET_VALID : null,
  PASSWORD_RESET_SET_ERRORS: null,
  PASSWORD_RESET_CLEAR_ERRORS: null,
  PASSWORD_RESET_REQUEST : null,
  PASSWORD_RESET_RESPONSE : null,

  MODEMNG_FILTER_ADD: null,
  MODEMNG_FILTER_REMOVE: null,
  MODEMNG_SET_NAME_FILTER: null,
  MODEMNG_SET_MODAL: null,
  MODEMNG_SET_MODES: null,
  MODEMNG_SET_ACTIVE_PAGE: null,
  MODEMNG_REQUEST_FILTER_OPTIONS: null,
  MODEMNG_RECEIVED_FILTER_OPTIONS: null,
  MODEMNG_REQUEST_USERS: null,
  MODEMNG_RECEIVED_USERS: null,
  MODEMNG_SET_CHANGED_MODES: null,
  MODEMNG_SAVE_MODE_CHANGES: null,
  MODEMNG_MARK_USER_DEACTIVATION: null,
  MODEMNG_DEACTIVATE_USER: null,
  
  ADMIN_REQUESTED_ACTIVITY: null,
  ADMIN_RECEIVED_ACTIVITY: null,
  
  ADMIN_RESET_USER_DATA: null,
  
  ADMIN_REQUESTED_SESSIONS: null,
  ADMIN_RECEIVED_SESSIONS: null,
  
  ADMIN_REQUESTED_METERS: null,
  ADMIN_RECEIVED_METERS: null,
  
  ADMIN_FILTER_USER: null,

  ADMIN_EXPORT_REQUEST: null,
  ADMIN_EXPORT_COMPLETE: null,
  
  ADMIN_ADD_USER_SHOW: null,
  ADMIN_ADD_USER_HIDE: null,
  ADMIN_ADD_USER_SELECT_GENDER_MALE: null,
  ADMIN_ADD_USER_SELECT_GENDER_FEMALE: null,
  ADMIN_ADD_USER_SELECT_UTILITY: null,
  ADMIN_ADD_USER_FILL_FORM: null,
  ADMIN_ADD_USER_VALIDATION_ERRORS_OCCURRED: null,
  ADMIN_ADD_USER_SHOW_MESSAGE_ALERT: null,
  ADMIN_ADD_USER_HIDE_MESSAGE_ALERT: null,
  ADMIN_ADD_USER_MAKE_REQUEST: null,
  ADMIN_ADD_USER_RECEIVE_RESPONSE: null,
  ADMIN_ADD_USER_GET_UTILITIES_MAKE_REQUEST: null,
  ADMIN_ADD_USER_GET_UTILITIES_RECEIVE_RESPONSE: null,

  GROUP_REQUEST_GROUP: null,
  GROUP_RECEIVE_GROUP_INFO: null,
  GROUP_RECEIVE_GROUP_MEMBERS: null,
  GROUP_SHOW_FAVOURITE_GROUP_FORM: null,
  GROUP_HIDE_FAVOURITE_GROUP_FORM: null,
  GROUP_RESET_COMPONENT: null,
  GROUP_SHOW_FAVOURITE_ACCOUNT_FORM: null,
  GROUP_HIDE_FAVOURITE_ACCOUNT_FORM: null,

  // Client Configuration

  config: {
    utility: {
      REQUEST_CONFIGURATION: null,
      SET_CONFIGURATION: null
    },
    reports: {
      SET_CONFIGURATION: null
    }
  },

  // Reports

  reports: {
    
    // Reports on measurements 
    
    measurements: {
      INITIALIZE: null,
      INIT_MULTIPLE: null,
      CHANGE_MULTIPLE_QUERY: null,
      SET_SOURCE: null,
      SET_QUERY_SOURCE: null,
      SET_TIMESPAN: null,
      SET_POPULATION: null,
      SET_OVERLAP: null,
      REQUEST_DATA: null,
      REQUEST_MULTIPLE_DATA: null,
      SET_DATA: null,
      SET_MULTIPLE_DATA: null,      
      ADD_SERIES: null,
      REMOVE_SERIES: null,
      ADD_FAVOURITE_REQUEST: null,
      ADD_FAVOURITE_RESPONSE: null,
      CHARTS_SAVE_LAYOUT_RESPONSE: null
    },

    // Reports on system utilization

    system: {
      INITIALIZE: null, 
      REQUEST_DATA: null,
      SET_DATA: null
    }
  },
 
  // Chart panels
  
  charting: {
    SET_FIELD: null,
    SET_REPORT: null
  },

  // Overview reports (atop of measurement reports)

  overview: {
    SETUP: null
  },

  // Trials

  trials: {
    SET_REFERENCE_TIME: null
  },

  // Alerts

 
  USER_REQUEST_USER: null,
  USER_RECEIVE_USER_INFO: null,
  USER_RECEIVE_GROUP_MEMBERSHIP_INFO: null,
  USER_SHOW_FAVOURITE_ACCOUNT_FORM: null,
  USER_HIDE_FAVOURITE_ACCOUNT_FORM: null,
        
  //manage alerts
  ADMIN_REQUESTED_UTILITIES: null,
  ADMIN_RECEIVED_UTILITIES: null,        
  ADMIN_SELECTED_UTILITY_FILTER: null,      
  ADMIN_REQUESTED_STATIC_TIPS: null,
  ADMIN_RECEIVED_STATIC_TIPS: null,        
  SAVE_BUTTON_DISABLED: null,
  SAVE_BUTTON_CLICKED: null,
  ADMIN_CLICKED_SAVE_BUTTON: null,
  ADMIN_SAVE_BUTTON_RESPONSE: null,
  ADMIN_SAVED_ACTIVE_TIPS: null,
  CHECKBOX_CLICKED: null,
  ADMIN_REQUESTED_ADD_TIP: null,
  ADMIN_ADD_TIP_RESPONSE: null,
  ADMIN_ADD_TIP_SHOW: null,
  ADMIN_CANCEL_ADD_TIP_SHOW: null,
  ADMIN_EDIT_TIP: null,
  STATIC_TIPS_ACTIVE_PAGE: null,
  ADMIN_TIPS_ACTIVE_STATUS_CHANGE: null,
  ADMIN_EDITED_TIP: null,
  ADMIN_TIPS_SAVE_BUTTON_DISABLED: null,
  ADMIN_CHECKBOX_CLICKED: null,
  ADMIN_DELETE_TIP: null,
  ADMIN_DELETE_TIP_REQUEST: null,
  ADMIN_DELETE_TIP_RESPONSE: null,
  MESSAGES_DELETE_MODAL_SHOW: null,
  MESSAGES_DELETE_MODAL_HIDE: null,
  MESSAGES_REQUESTED_STATISTICS: null,
  MESSAGES_RECEIVED_STATISTICS: null,
  MESSAGES_INDEX_CHANGE: null,
  MESSAGES_SHOW_RECEIVERS: null,
  MESSAGES_REQUESTED_RECEIVERS: null,
  MESSAGES_RECEIVED_RECEIVERS: null,
  MESSAGES_SELECTED_MESSAGE: null,
  MESSAGES_RETURN_BACK: null,
  MESSAGES_SET_EDITOR_VALUE: null,
  MESSAGES_SELECT_EDITOR: null,
  MESSAGES_SET_TIMEZONE: null,
  
  //Announcements
  ANNC_REQUESTED_USERS: null,
  ANNC_RECEIVED_USERS: null,
  ANNC_SET_INITIAL_USERS: null,
  ANNC_INITIAL_USERS_SET_SELECTED: null,
  ANNC_ADDED_USERS_SET_SELECTED: null,
  ANNC_ADD_USERS_BUTTON_CLICKED: null,
  ANNC_REMOVE_USERS_BUTTON_CLICKED: null,
  ANNC_SHOW_FORM: null,
  ANNC_CANCEL_SHOW_FORM: null,
  ANNC_BROADCAST_ANNOUNCEMENT_REQUEST: null,
  ANNC_BROADCAST_ANNOUNCEMENT_RESPONSE: null,
  ANNC_REQUESTED_ANNOUNCEMENT_HISTORY: null,
  ANNC_RECEIVED_ANNOUNCEMENT_HISTORY: null,
  ANNC_FILTER_USERS: null,
  ANNC_REQUESTED_GROUPS: null,
  ANNC_RECEIVED_GROUPS: null,
  ANNC_SELECT_GROUP: null,
  ANNC_SET_SELECTED_ALL: null,
  ANNC_SHOW_DELETE_MODAL: null,
  ANNC_HIDE_DELETE_MODAL: null,
  ANNC_DELETE_ANNOUNCEMENT_REQUEST: null,
  ANNC_DELETE_ANNOUNCEMENT_RESPONSE: null,
  ANNC_SHOW_ANNOUNCEMENT_REQUEST: null,
  ANNC_SHOW_ANNOUNCEMENT_RESPONSE: null,  
  ANNC_GO_BACK: null, 
  //
  
  QUERY_SUBMIT: null,
  QUERY_RESPONSE: null,

  DEBUG_CREATE_USER: null,
  DEBUG_USER_CREATED: null,
  DEBUG_CREATE_AMPHIRO: null,
  DEBUG_AMPHIRO_CREATED: null,
  DEBUG_SET_TIMEZONE: null,
  DEBUG_SET_ERRORS: null,
  DEBUG_AMPHIRO_DATA_GENERATE_REQUEST: null,
  DEBUG_AMPHIRO_DATA_GENERATED: null,
  DEBUG_GET_FEATURES: null,

  //Viewport
  VIEWPORT_SET_SIZE: null,
});

module.exports = types;
