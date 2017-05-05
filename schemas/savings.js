const savingsSchema = actions => [{
    name: 'key',
    title: 'Key',
    hidden: true
  }, 
  {
    name: 'name',
    title: 'Savings.List.name',
    link: function(row) {
      if(row.key) {
        return '/savings/{key}/';
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
    },
    sortable: false,
  },  
  {
    name: 'paramsShort',
    title: 'Savings.List.paramsShort',
    sortable: false,
  },
  {
    name: 'owner',
    title: 'Savings.List.owner',
    sortable: false,
  },
  {
    name: 'createdOn',
    title: 'Savings.List.createdOn',
    type: 'datetime',
  }, 
  {
    name: 'processingEndOn',
    title: 'Savings.List.completedOn',
    type: 'datetime',
    sortable: false,
  }, 
  {
    name: 'status',
    title: 'Savings.List.status',
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
      actions.goToExploreView(row.key);
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
      actions.confirmRemoveScenario(row.key);
    }),
    visible : true 
  }
];

module.exports = {
  savingsSchema
};
