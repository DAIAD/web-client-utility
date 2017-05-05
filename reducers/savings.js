var types = require('../constants/SavingsActionTypes');


const initialState = {
  scenarioToRemove: null,
  areas: [],
  query: {
    pageIndex: 0,
    sortBy: 'CREATED_ON',
    sortAscending: false,
    status: null,
    name: null,
  },
  scenarios: [], 
};

var savings = function (state=initialState, action) {

  switch (action.type) {
    
    case types.SAVINGS_CONFIRM_REMOVE_SCENARIO: 
      return Object.assign({}, state, {
       scenarioToRemove: action.id
      }); 

    case types.SAVINGS_SET_SCENARIOS:
      return {
        ...state,
        scenarios: action.scenarios,
      };

    case types.SAVINGS_SET_AREAS:
      return {
        ...state,
        areas: action.areas,
      };

    case types.SAVINGS_SET_QUERY: 
      return {
        ...state,
        query: {
          ...state.query,
          ...action.query,
        },
      };

    default:
      return state;
  }
};

module.exports = savings;

