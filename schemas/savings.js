const savingsSchema = actions => [{
    name: 'id',
    title: 'Id',
    hidden: true
  }, 
  {
    name: 'name',
    title: 'Savings.List.name',
    link: function(row) {
      if(row.id) {
        return '/savings/{id}/';
      }
      return null;
    },
    style: {
      whiteSpace: 'nowrap'
    }
  }, 
  {
    name: 'potential',
    title: 'Savings.List.potential', 
    style: {
      fontWeight: 'bold',
      fontSize: '1.1em',
      textAlign: 'center'
    }
  },  
  {
    name: 'paramsShort',
    title: 'Savings.List.paramsShort',
  },
  {
    name: 'user',
    title: 'Savings.List.user',
  },
  {
    name: 'createdOn',
    title: 'Savings.List.createdOn',
    type: 'datetime',
  }, 
  {
    name: 'completedOn',
    title: 'Savings.List.completedOn',
    type: 'datetime',
  }, 
  {
    name : 'explore',
    title: 'Savings.List.explore',
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
    title: 'Savings.List.delete',
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
