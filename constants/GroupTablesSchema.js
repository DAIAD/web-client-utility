
var GroupTablesSchema = {

  Members: {
    fields: [
      {
        name: 'key',
        hidden: true
      }, {
        name: 'fullName',
        title: 'Group.Table1.Name',
        link: '/user/{key}'
      }, {
        name: 'username',
        title: 'Group.Table1.Email'
      }, {
        name: 'createdOn',
        title: 'Group.Table1.RegisteredOn',
        type: 'datetime'
      }, {
        name : 'favourite',
        type : 'action'
      }
    ],
    rows : [],
    pager: {
      index: 0,
      size: 10
    }
  }
};

module.exports = GroupTablesSchema;
