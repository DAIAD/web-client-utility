
const budgetSchema = actions => [{
    name: 'key',
    title: 'Key',
    hidden: true
  }, 
  {
    name: 'name',
    title: 'Budgets.List.name',
    link: function(row) {
      if(row.key) {
        return '/budgets/{key}/';
      }
      return null;
    },
    style: {
      whiteSpace: 'nowrap'
    }
  }, 
  {
    name: 'active',
    title: 'Budgets.List.active',
    type: 'action',
    style: {
      textAlign: 'center',
      fontSize: '1.2em',
      width: 70
    },
    icon: function(field, row) {
      return row.active ? 'check' : '';
    },
    handler: null, 
  }, 
  {
    name: 'paramsShort',
    title: 'Budgets.List.paramsShort'
  },
  {
    name: 'numberOfConsumers',
    title: 'Budgets.List.consumers',
  },
  /*
  {
    name: 'owner',
    title: 'Budgets.List.owner'
    },
    */
  {
    name: 'createdOn',
    title: 'Budgets.List.createdOn',
    type: 'datetime',
  }, 
  {
    name: 'updatedOn',
    title: 'Budgets.List.updatedOn',
    type: 'datetime',
  }, 
  {
    name: 'activatedOn',
    title: 'Budgets.List.activatedOn',
    type: 'datetime',
  },
  {
    name : 'explore',
    title: 'Budgets.List.explore',
    type : 'action',
    icon : 'info-circle',
    style: {
      textAlign: 'center',
      fontSize: '1.3em'
    },
    handler : (function(field, row) {
      actions.goToExploreView(row.key);
    }),
    visible : (function(field, row) {
      return true;
    })
  }, 
  {
    name : 'delete',
    title: 'Budgets.List.delete',
    type : 'action',
    icon : 'remove',
    handler : (function(field, row) {
      actions.confirmRemoveBudgetScenario(row.key);
    }),
    visible : true 
  }
];

const exploreBudgetSchema = actions => [
  {
    name: 'key',
    title: 'Key',
    hidden: true
  }, 
  {
    name: 'email',
    title: 'User',
    link: function(row) {
      if(row.key) {
        return '/user/{key}/';
      }
      return null;
    }
  }, 
  {
    name: 'fullname',
    title: 'Name'
  }, 
  {
    name: 'serial',
    title: 'SWM'
  }, 
  {
    name: 'registrationDateMils',
    title: 'Registered On',
    type: 'datetime'
  }, 
  {
    name: 'budget',
    title: 'Difference (\u33A5)'
  },
  {
    name: 'savings',
    title: 'Savings (%)',
  },
];

module.exports = {
  budgetSchema,
  exploreBudgetSchema
};

