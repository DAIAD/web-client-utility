
const budgetSchema = actions => [{
    name: 'id',
    title: 'Id',
    hidden: true
  }, 
  {
    name: 'name',
    title: 'Budgets.List.name',
    style: {
      width: 100
    },
    link: function(row) {
      if(row.id) {
        return '/budgets/{id}/';
      }
      return null;
    },
  }, 
  {
    name: 'active',
    title: 'Budgets.List.active',
    type: 'action',
    style: {
      textAlign: 'center',
      fontSize: '1.2em',
      width: 50
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
    name: 'user',
    title: 'Budgets.List.user'
  },
  {
    name: 'createdOn',
    title: 'Budgets.List.createdOn',
    type: 'datetime',
  }, 
  {
    name: 'completedOn',
    title: 'Budgets.List.completedOn',
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
      actions.goToExploreView(row.id);
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
      actions.confirmRemoveBudgetScenario(row.id);
    }),
    visible : true 
  }
];

const activeBudgetsSchema = actions => [
    {
      name: 'id',
      title: 'id',
      hidden: true
    },
    {
      name: 'name',
      title: 'Name',
      hidden: true,
    },
    {
      name: 'activatedOn', 
      title: 'Activated', 
      type: 'datetime',
      hidden: true,
    },
    {
      name: 'goal',
      title: 'Goal',
      type: 'element',
      style: {
        height: 100
      }
    },
    {
      name: 'savings',
      title: 'Savings',
      type: 'element',
      style: {
        height: 100
      }
    },
    {
      name: 'affected',
      title: 'Affected',
      type: 'element',
      style: {
        height: 100
      }
    }
];

module.exports = {
  budgetSchema,
  activeBudgetsSchema
};

