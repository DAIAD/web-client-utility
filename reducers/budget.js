var types = require('../constants/BudgetActionTypes');

const initialState = {
  budgetToRemove: null,
  searchFilter: null,
  budgetToSet: null,
  budgetToReset: null,
  savings: [],
  query: {
    pageIndex: 0,
    sortBy: 'CREATED_ON',
    sortAscending: false,
    name: null,
  },
  budgets: [],
  explore: {
    query: {
      cluster: 'none',
      group: 'all',
      geometry: null,
      index: 0,
      size: 10,
      serial: null,
      text: null,
      loading: false
    },
    data: {
      total: null,
      accounts: null,
      features: null,
    },
    errors: null,
  }
};

var budget = function (state=initialState, action) {

  switch (action.type) {
    
    case types.BUDGET_SET_BUDGETS: 
      return Object.assign({}, state, {
        budgets: action.budgets,
      });

    case types.BUDGET_CONFIRM_REMOVE_SCENARIO: 
      return Object.assign({}, state, {
       budgetToRemove: action.id 
      }); 

    case types.BUDGET_CONFIRM_SET: 
      return Object.assign({}, state, {
       budgetToSet: action.id 
      }); 

    case types.BUDGET_CONFIRM_RESET: 
      return Object.assign({}, state, {
       budgetToReset: action.id 
      }); 

    case types.BUDGET_SET_SAVINGS_SCENARIOS: 
      return Object.assign({}, state, {
        savings: action.scenarios,
      });

    case types.BUDGET_ADD_SCENARIO: { 
      const newScenarios = [...state.scenarios, {...action.options}];
      return Object.assign({}, state, {scenarios: newScenarios});
    }

    case types.BUDGET_REMOVE_SCENARIO: {
      const newScenarios = state.scenarios.filter(scenario => scenario.id !== action.id);
      return Object.assign({}, state, {scenarios: newScenarios});
    }

    case types.BUDGET_SET_ACTIVE: {
      const budgets = [...state.scenarios].map(budget => budget.id === action.id ? ({...budget, activatedOn:action.date}) : budget);
      return Object.assign({}, state, {
        scenarios: budgets
      });
    }

    case types.BUDGET_SET_INACTIVE: {
      const budgets = [...state.scenarios].map(budget => budget.id === action.id ? ({...budget, activatedOn: null}) : budget);
      return Object.assign({}, state, {
        scenarios: budgets
      });
    }
    case types.BUDGET_SET_QUERY: 
      return {
        ...state,
        query: {
          ...state.query,
          ...action.query,
        },
      };

   case types.BUDGET_SET_SEARCH_FILTER: 
      return Object.assign({}, state, {
        searchFilter: action.searchFilter
      });

    case types.BUDGET_EXPLORE_SET_QUERY:
      return {
        ...state,
        explore: {
          ...state.explore,
          query: {
            ...state.explore.query,
            ...action.query
          }
        }
      };

    case types.BUDGET_EXPLORE_REQUEST_DATA:
      return {
        ...state,
        explore: {
          ...state.explore,
          query: {
            ...state.explore.query,
            loading: true
          }
        }
      };

    case types.BUDGET_EXPLORE_SET_DATA:
      return {
        ...state,
        explore: {
          ...state.explore,
          query: {
            ...state.explore.query,
            loading: false
          },
          data: {
            accounts: action.data.accounts,
            features: action.data.features,
            total: action.data.total
          },
          errors: action.errors
        }
      };

   default:
    return state;
  }
};

module.exports = budget;

