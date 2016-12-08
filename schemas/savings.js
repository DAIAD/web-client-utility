const savingsSchema = actions => [{
    name: 'id',
    title: 'Id',
    hidden: true
  }, 
  {
    name: 'name',
    title: 'Name',
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
    title: 'Potential',
  }, 
  {
    name: 'user',
    title: 'User',
  }, 
  {
    name: 'paramsShort',
    title: 'Parameters',
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
  },
  {
    name : 'delete',
    title: 'Delete',
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
