const savingsSchema = actions => [{
    name: 'id',
    title: 'Id',
    hidden: true
  }, 
  {
    name: 'name',
    title: 'Savings.list.name',
    width: 120,
    link: function(row) {
      if(row.id) {
        return '/savings/{id}/';
      }
      return null;
    }
  }, 
  {
    name: 'potential',
    title: 'Savings.list.potential', 
  }, 
  {
    name: 'user',
    title: 'Savings.list.user',
  }, 
  {
    name: 'paramsShort',
    title: 'Savings.list.paramsShort',
  },
  {
    name: 'createdOn',
    title: 'Savings.list.createdOn',
    type: 'datetime',
  }, 
  {
    name: 'completedOn',
    title: 'Savings.list.completedOn',
    type: 'datetime',
  }, 
  {
    name : 'explore',
    title: 'Savings.list.explore',
    type : 'action',
    icon : 'info-circle',
    style: {
      textAlign: 'center',
      fontSize: '1.3em'
    },
    handler : (function(field, row) {
      actions.goToExploreView(row.id);
    }),
  },
  {
    name : 'delete',
    title: 'Savings.list.delete',
    type : 'action',
    icon : 'remove',
    style: {
      textAlign: 'center',
      fontSize: '1.0em'
    },
    handler : (function(field, row) {
      actions.confirmRemoveScenario(row.id);
    }),
    visible : true 
  }
];

module.exports = {
  savingsSchema
};
