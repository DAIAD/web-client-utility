
const budgetSchema = actions => [{
    name: 'id',
    title: 'Id',
    hidden: true
  }, 
  {
    name: 'name',
    title: 'Name',
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
    title: 'Active',
    type: 'action',
    style: {
      textAlign: 'center',
      fontSize: '1.2em'
    },
    icon: function(field, row) {
      return row.active ? 'check' : '';
    },
    handler: null, 
  }, 
  {
    name: 'paramsShort',
    title: 'Parameters',
  },
  {
    name: 'user',
    title: 'User',
  },
  {
    name: 'createdOn',
    title: 'Created',
    type: 'datetime',
  }, 
  {
    name: 'completedOn',
    title: 'Finished',
    type: 'datetime',
  }, 
  {
    name: 'activatedOn',
    title: 'Activated',
    type: 'datetime',
  },
  {
    name : 'explore',
    title: 'Explore',
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
    title: 'Delete',
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
        height: 150
      }
    },
    {
      name: 'savings',
      title: 'Savings',
      type: 'element',
      style: {
        height: 150
      }
    },
    {
      name: 'affected',
      title: 'Affected',
      type: 'element',
      style: {
        height: 150
      }
    }
];

module.exports = {
  budgetSchema,
  activeBudgetsSchema
};

