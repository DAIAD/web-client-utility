var types = require('../constants/SavingsActionTypes');

const initialState = {
  validationError: null,
  searchFilter: null,
  removeScenario: null,
  scenarios: [{
       id: 1,
       name: 'Scenario 1',
       user: 'foofootos',
       parameters: {who: {value: 'all', label: 'All'}, where: {value: 'all', label: 'All'}, when: {value: 'last', label:'Last year'}},
       createdOn: new Date(),
       completedOn: new Date(),
       potential: '18M lt'
       //completedOn: null
     },
     {
       id: 2,
       name: 'Scenario 2',
       user: 'foofootos',
       parameters: {who: {value: 'all', label: 'All'}, where: [{value: 'blabla', label: 'Bla'}], when: {value: 'last', label:'Last year'}},
       createdOn: new Date('1990-01-01'),
       completedOn: new Date('1999-01-01'),
       potential: '25M lt'
     }] 
};

var savings = function (state=initialState, action) {

  switch (action.type) {
    
    case types.SAVINGS_CONFIRM_REMOVE_SCENARIO: 
      return Object.assign({}, state, {
       removeScenario: action.id
      }); 

    case types.SAVINGS_SET_VALIDATION_ERROR: 
      return Object.assign({}, state, {
        validationError: action.error
      });

    case types.SAVINGS_ADD_SCENARIO: { 
      const newScenarios = [...state.scenarios, {...action.options}];
      return Object.assign({}, state, {scenarios: newScenarios});
    }

    case types.SAVINGS_REMOVE_SCENARIO: {
      const newScenarios = state.scenarios.filter(scenario => scenario.id !== action.id);
      return Object.assign({}, state, {scenarios: newScenarios});
    }

    case types.SAVINGS_SET_SEARCH_FILTER: 
      return Object.assign({}, state, {
        searchFilter: action.searchFilter
      });

    default:
      return state;
  }
};

module.exports = savings;

