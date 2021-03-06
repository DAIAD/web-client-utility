var React = require('react');
var Bootstrap = require('react-bootstrap');
var Table = require('../UserTable');
var Modal = require('../Modal');
var {FormattedMessage, FormattedTime} = require('react-intl');
var DropDown = require('../DropDown');

var { connect } = require('react-redux');
var { bindActionCreators } = require('redux');
var AnnouncementsActions = require('../../actions/AnnouncementsActions');
var self;

var Announcements = React.createClass({
  contextTypes: {
      intl: React.PropTypes.object
  },

  componentWillMount : function() {
    this.props.getAnnouncementHistory();
    this.props.getCurrentUtilityUsers();
    this.props.fetchGroups();
  },

  setFilter: function(e) {
    this.props.setFilter(this.refs.filter.getValue());
  },

  clearFilter: function(e) {
    this.props.setFilter('');
  },

  handleCurrentMembersCheckboxChange: function (rowId, row, checked){
    this.props.toggleInitialUserSelected(this.props.accounts, rowId, checked);
  },

  handleAddedMembersCheckboxChange: function (rowId, row, checked){
    this.props.toggleAddedUserSelected(this.props.addedUsers, rowId, checked);
  },
  addUsersButtonClick: function (){
    var addedAccounts = [];
    for(var obj in this.props.accounts){

      for(var prop in this.props.accounts[obj]){
        if(prop == "selected"){
          if(this.props.accounts[obj][prop] === true){
            //id is the accountKey. If null the account is resolved from the username
            this.props.accounts[obj].id = null; 
            addedAccounts.push(this.props.accounts[obj]);
          }
        }
      }
    }
    this.props.addUsers(addedAccounts);
  },

  removeUsersButtonClick: function (){
    var remainingAccounts = [];
    for(var obj in this.props.addedUsers){
      for(var prop in this.props.addedUsers[obj]){
        if(prop == "selected"){
          if(this.props.addedUsers[obj][prop] === false){
            remainingAccounts.push(this.props.addedUsers[obj]);
          }
        }
      }
    }
    this.props.removeUsers(remainingAccounts);
  },

  render: function() {
    var thisAnnouncements = this;
    self = this;
      var historyTable = {
          fields: [{
             name: 'id',
             title: 'Section.Engagement.Announcements.Table1.Id',
             hidden: true
          }, {
             name: 'title',
             title: 'Section.Engagement.Announcements.Table1.Title'
          }, {
             name: 'content',
             title: 'Section.Engagement.Announcements.Table1.Content'
          }, {
             name: 'createdOn',
             title: 'Section.Engagement.Announcements.Table1.DispatchedOn',
             type: 'datetime'
          }, {
            name: 'view',
            title: 'Section.Engagement.Announcements.Table1.Details',
            type:'action',
            icon: 'group',
            handler: function() {
              self.props.showAnnouncementDetails(this.props.row);
            },
          }, {
            name: 'cancel',
            title: 'Section.Engagement.Announcements.Table1.Delete',
            type:'action',
            icon: 'remove',
            handler: function() {
              self.props.setShowModal(this.props.row);
            }
          }],
          rows: this.props.announcements,
          pager: {
            index: 0,
            size: 3,
            count:this.props.announcements ? this.props.announcements.length : 0
          }
        };

    var filteredAccounts = [];
    if(this.props.accounts) {
      var records = this.props.accounts;
      for(var i=0, count=records.length; i<count; i++) {
        if((!this.props.filter) || (records[i].username.indexOf(this.props.filter) !== -1)) {
          filteredAccounts.push({
            id: records[i].id,
            username: records[i].username || '',
            lastName: records[i].lastName || '',
            selected: records[i].selected || false
          });
        }
      }
    }

    var currentUsersFields = {
        fields: [{
          name: 'accountId',
          title: 'Section.Engagement.Announcements.Table2.Id',
          hidden: true
        }, {
          name: 'lastName',
          title: 'Section.Engagement.Announcements.Table2.LastName'
        }, {
          name: 'username',
          title: 'Section.Engagement.Announcements.Table2.UserName'
        }, {
          name: 'all',
          title: 'Section.Engagement.Announcements.Table2.All'
        }, {
          name: 'selected',
          type:'alterable-boolean',
          handler: function(field, row) {
            self.handleCurrentMembersCheckboxChange(field, row, this.checked);
          }
        }],
        rows: filteredAccounts,
        pager: {
          index: 0,
          size: 10,
          count:this.props.accounts ? this.props.accounts.length : 0
        }
    };

    var addedUsersFields = {
      fields: [{
        name: 'accountId',
        title: 'Section.Engagement.Announcements.Table3.Id',
        hidden: true
      }, {
          name: 'lastName',
          title: 'Section.Engagement.Announcements.Table3.LastName'
      }, {
        name: 'username',
        title: 'Section.Engagement.Announcements.Table3.UserName'
      }, {
        name: 'selected',
        type:'boolean',
        handler: function(field, row) {
          self.handleAddedMembersCheckboxChange(field, row, this.checked);
        }
      }],
      rows: this.props.addedUsers,
      pager: {
        index: 0,
        size: 10,
        count:this.props.addedUsers ? this.props.addedUsers.length : 0
      }
    };

    var finalUsersFields = {
      fields: [{
        name: 'accountId',
        title: 'Section.Engagement.Announcements.Table4.Id',
        hidden: true
      }, {
          name: 'lastName',
          title: 'Section.Engagement.Announcements.Table4.LastName'
      }, {
        name: 'username',
        title: 'Section.Engagement.Announcements.Table4.UserName'
      }],
      rows: this.props.addedUsers,
      pager: {
        index: 0,
        size: 10,
        count:this.props.addedUsers ? this.props.addedUsers.length : 0
      }
    };

    const usersTitle = (
      <span>
        <i className='fa fa-calendar fa-fw'></i>
          <span style={{ paddingLeft: 4 }}>Users</span>
          <span style={{float: 'right',  marginTop: -3, marginLeft: 5 }}></span>
      </span>
    );

    const selectedUsersTitle = (
      <span>
        <i className='fa fa-calendar fa-fw'></i>
          <span style={{ paddingLeft: 4 }}>Selected Users</span>
          <span style={{float: 'right',  marginTop: -3, marginLeft: 5 }}></span>
      </span>
    );

    const historyTitle = (
      <span>
       <i className='fa fa-calendar fa-fw'></i>
       <span style={{ paddingLeft: 4 }}>History</span>
       <span style={{float: 'right',  marginTop: -3, marginLeft: 5 }}>
      </span>
      </span>
     );

    var filter = (
      <div className='col-md-12'>
        <Bootstrap.Input type='text'
          id='filter' name='filter' ref='filter'
          placeholder='Search users by username ...'
          onChange={this.setFilter}
          value={this.props.filter}
          buttonAfter={
           <Bootstrap.Button onClick={this.clearFilter} style={{paddingTop: 7, paddingBottom: 7 }}><i className='fa fa-trash fa-fw'></i></Bootstrap.Button>
         }
        />
      </div>
    );

    var groupOptions = [];
    groupOptions.push({id : null, label: 'Everyone'});
    if(this.props.groups){
      for(var obj in this.props.groups){
        groupOptions.push({value: this.props.groups[obj].id, label: this.props.groups[obj].name});
      }
    }

    var groupDisabled;
    var groupTitle;
    if(groupOptions.length === 1){
      groupTitle = 'No groups available';
      groupDisabled = true;
    }
    else{
      groupTitle = 'Everyone';
      groupDisabled = false;
    }
    var groupDropDown = (
      <div className='form-horizontal report-form' >
        <div className='col-sm-1 control-label'>
          <label>Group:</label>
        </div>
        <div className='col-sm-9' style = {{marginLeft: 8, marginBottom:10}}>
          <DropDown
            title = {this.props.group ? this.props.group.label : groupTitle}
            options={groupOptions}
            disabled={groupDisabled}
            onSelect={this.props.setGroup}
          />
        </div>
      </div>
    );
    var usersTable = (
      <div>
        <Table data={currentUsersFields} setSelectedAll={this.props.setSelectedAll} allChecked={thisAnnouncements.props.checked}></Table>
      </div>
    );

    var addedUsersTable = (
      <div>
        <Table data={addedUsersFields} setSelectedAll={this.props.setSelectedAll}></Table>
      </div>
    );

    var finalUsersTable = (
      <div>
        <Table data={finalUsersFields}></Table>
      </div>
    );

    var announcementForm = (
      <div>
        <Bootstrap.Row>
          <Bootstrap.Col xs={6}>
            <label>Title</label>
            <textarea name="title"
              rows="1" cols="120"
              ref="title"
              defaultValue={""}
            />
          </Bootstrap.Col>
        </Bootstrap.Row>
         <Bootstrap.Row>
          <Bootstrap.Col xs={6}>
            <label>Content</label>
            <textarea name="content"
              rows="3" cols="120"
              ref="content"
              defaultValue={""}
            />
          </Bootstrap.Col>
        </Bootstrap.Row>
         <Bootstrap.Row>
          <Bootstrap.Col xs={6}>
            <div>
              <button id='add'
                label = 'Add'
                type = 'submit'
                className = 'btn btn-primary'
                onClick = {this.props.broadcastAnnouncement}
                  style={{height: 33}}>
                <FormattedMessage id='Section.Engagement.Announcements.Button.Broadcast' />
              </button>
              <button id='cancel'
                label = 'Cancel'
                type = 'cancel'
                className = 'btn btn-primary'
                onClick={this.props.cancelShowForm}
                  style={{ height: 33, marginLeft : 10}}>
                <FormattedMessage id='Section.Engagement.Announcements.Button.Cancel' />
              </button>
            </div>
          </Bootstrap.Col>
        </Bootstrap.Row>
      </div>
      );

    if(this.props.showForm){
      return (
        < div className = "container-fluid" style = {{ paddingTop: 10 }} >
          <div className="row">
              <Bootstrap.Panel header={selectedUsersTitle}>
                <Bootstrap.ListGroup fill>
                  <Bootstrap.ListGroupItem>
                    {finalUsersTable}
                  </Bootstrap.ListGroupItem>
                </Bootstrap.ListGroup>
              </Bootstrap.Panel>
          </div>
          <div className="row">
            {announcementForm}
          </div>
        </div>
      );
    }

    if(this.props.showModal){
      var title = 'Delete Announcement?';
         var actions = [{
            action: self.props.hideModal,
            name: "Cancel"
           },  {
              action: this.props.confirmDeleteAnnouncement,
              name: "Delete",
              style: 'danger'
            }];
      return (
       <div>
            <Modal show = {this.props.showModal}
              onClose = {this.props.hideModal}
              title = {title}
              text = {'You are about to delete the announcement with title "' + this.props.announcement.title + '". This announcement will not be visible to users anymore. Are you sure?'}
                actions = {actions}
            />
      </div>
      );
    }

    if(this.props.showAnnouncementDetailsTable){

      var receiversFields = {
        fields: [{
          name: 'accountId',
          title: 'id',
          hidden: true
        }, {
          name: 'fullName',
          title: 'Name'
        }, {
          name: 'username',
          title: 'Username'
        }, {
          name: 'acknowledgedOn',
          title: 'Acknowledged On',
          type: 'datetime'
        }],
        rows: this.props.receivers,
        pager: {
          index: 0,
          size: 10,
          count:this.props.receivers ? this.props.receivers.length : 0
        }
      };

      var receiversTitle = (
        <span>
          <i className='fa fa-calendar fa-fw'></i>
            <span style={{ paddingLeft: 4 }}>Users that received this announcement</span>
            <span style={{float: 'right',  marginTop: -3, marginLeft: 5 }}></span>
        </span>
      );

      var announcementTitle = (
        <span>
          <i className='fa fa-calendar fa-fw'></i>
            <span style={{ paddingLeft: 4 }}>Announcement Info</span>
            <span style={{float: 'right',  marginTop: -3, marginLeft: 5 }}></span>
        </span>
      );
      var receiversTable = (
        <div>
          <Table data={receiversFields}></Table>
        </div>
      );

    var announcementInfo = (
      <div>
        <Bootstrap.Row>
          <Bootstrap.Col xs={6}>
            <label>Title:</label>
          </Bootstrap.Col>
          <Bootstrap.Col xs={6}>
            <div style={{fontSize:16}}>
              <label>{this.props.announcement.title}</label>
            </div>
          </Bootstrap.Col>
        </Bootstrap.Row>
         <Bootstrap.Row>
          <Bootstrap.Col xs={6}>
            <label>Content:</label>
          </Bootstrap.Col>
          <Bootstrap.Col xs={6}>
            <div style={{fontSize:16}}>
              <label>{this.props.announcement.content}</label>
            </div>
          </Bootstrap.Col>
        </Bootstrap.Row>
         <Bootstrap.Row>
          <Bootstrap.Col xs={6}>
            <label>Dispatched On:</label>
          </Bootstrap.Col>
          <Bootstrap.Col xs={6}>
            <div style={{fontSize:16}}>
              <label>
                <FormattedTime value={this.props.announcement.createdOn}
                               day='numeric'
                               month='numeric'
                               year='numeric'
                               hour='numeric'
                               minute='numeric' 
                  />
              </label>
            </div>
          </Bootstrap.Col>
        </Bootstrap.Row>
      </div>
      );

      return (
        < div className = "container-fluid" style = {{ paddingTop: 10 }} >
          <div className="row">
              <Bootstrap.Panel header={announcementTitle}>
                <Bootstrap.ListGroup fill>
                  <Bootstrap.ListGroupItem>
                    {announcementInfo}
                  </Bootstrap.ListGroupItem>
                </Bootstrap.ListGroup>
              </Bootstrap.Panel>
          </div>
          <div className="row">
              <Bootstrap.Panel header={receiversTitle}>
                <Bootstrap.ListGroup fill>
                  <Bootstrap.ListGroupItem>
                    {receiversTable}
                  </Bootstrap.ListGroupItem>
                </Bootstrap.ListGroup>
              </Bootstrap.Panel>
          </div>
            <div className="row">
              <Bootstrap.Button
                onClick = {this.props.goBack}>
                {'Back'}
              </Bootstrap.Button>
            </div>
        </div>

      );
    }

    if(this.props.groups && this.props.accounts && this.props.announcements && !this.props.isLoading){
      return (
        <div className="container-fluid" style={{ paddingTop: 10 }}>
          <div className="row">
            <div className='col-md-5 equal-height-col'>
              <Bootstrap.Panel header={usersTitle}>
                <Bootstrap.ListGroup fill>
                  <Bootstrap.ListGroupItem>
                    {groupDropDown}
                    {filter}
                    {usersTable}
                  </Bootstrap.ListGroupItem>
                </Bootstrap.ListGroup>
              </Bootstrap.Panel>
            </div>

            <div className='col-md-2 equal-height-col' >
              <div className='div-centered'  style={{marginTop : 120}}>
                <div>
                  <Bootstrap.Button onClick = {this.addUsersButtonClick}>
                    {'>>>'}
                  </Bootstrap.Button>
                </div>
                <br></br>
                <div>
                  <div>
                  <Bootstrap.Button onClick = {this.removeUsersButtonClick} >
                    {'<<<'}
                  </Bootstrap.Button>
                  </div>
                </div>
              </div>
            </div>

            <div className='col-md-5 equal-height-col'>
              <Bootstrap.Panel header={selectedUsersTitle}>
                <Bootstrap.ListGroup fill>
                  <Bootstrap.ListGroupItem>
                    {addedUsersTable}
                    <div>
                      <Bootstrap.Button disabled = {this.props.addedUsers.length===0} onClick = {this.props.setShowForm}>
                        {'Form Announcement'}
                      </Bootstrap.Button>
                    </div>
                  </Bootstrap.ListGroupItem>
                </Bootstrap.ListGroup>
              </Bootstrap.Panel>
            </div>
          </div>
          <div>

            <div className="row">
              <div className="col-md-12">
                <Bootstrap.Panel header={historyTitle}>
                 <Bootstrap.ListGroup fill>
                  <Bootstrap.ListGroupItem>
                   <Table data={historyTable}></Table>
                  </Bootstrap.ListGroupItem>
                 </Bootstrap.ListGroup>
                </Bootstrap.Panel>
              </div>
            </div>
          </div>
        </div>
      );
    }
    else{
      return (
        <div>
          <img className='preloader' src='/assets/images/utility/preloader-counterclock.png' />
          <img className='preloader-inner' src='/assets/images/utility/preloader-clockwise.png' />
        </div>
      );
    }

  }
});

function mapStateToProps(state) {
  return {
      accounts: state.announcements.accounts,
      announcements: state.announcements.announcements,
      initialUsers: state.announcements.initialUsers,
      addedUsers: state.announcements.addedUsers,
      rowIdToggled: state.announcements.rowIdToggled,
      showForm: state.announcements.showForm,
      filter: state.announcements.filter,
      groups: state.announcements.groups,
      group: state.announcements.group,
      checked: state.announcements.checked,
      showModal: state.announcements.showModal,
      announcement: state.announcements.announcement,
      showAnnouncementDetailsTable: state.announcements.showAnnouncementDetailsTable,
      receivers: state.announcements.receivers
  };
}

function mapDispatchToProps(dispatch) {
  return {
    fetchGroups : bindActionCreators(AnnouncementsActions.fetchGroups, dispatch),
    setGroup: function (event, group){
      dispatch(AnnouncementsActions.setGroup(event, group));
      if(group.label == 'Everyone'){
        self.props.getCurrentUtilityUsers();
      }
      else{
        dispatch(AnnouncementsActions.getGroupUsers(group.value));
      }
    },
    getCurrentUtilityUsers: bindActionCreators(AnnouncementsActions.getCurrentUtilityUsers, dispatch),
    getAnnouncementHistory: bindActionCreators(AnnouncementsActions.getAnnouncementHistory, dispatch),
    toggleInitialUserSelected: function (accounts, accountId, selected){
      dispatch(AnnouncementsActions.setSelectedUser(accounts, accountId, selected));
    },
    toggleAddedUserSelected: function (addedUsers, accountId, selected){
      dispatch(AnnouncementsActions.setSelectedAddedUser(addedUsers, accountId, selected));
    },
    addUsers: bindActionCreators(AnnouncementsActions.addUsers, dispatch),
    removeUsers: bindActionCreators(AnnouncementsActions.removeUsers, dispatch),
    setShowForm: bindActionCreators(AnnouncementsActions.showForm, dispatch),
    cancelShowForm: bindActionCreators(AnnouncementsActions.cancelShowForm, dispatch),
    broadcastAnnouncement: function (){
      var announcement = {title : self.refs.title.value, content : self.refs.content.value};
      dispatch(AnnouncementsActions.broadCastAnnouncement(event, self.props.addedUsers, announcement));
    },
    setFilter: bindActionCreators(AnnouncementsActions.setFilter, dispatch),
    setSelectedAll: function (event, selected){
         dispatch(AnnouncementsActions.setSelectedAll(event, selected));
      },
    setShowModal : bindActionCreators(AnnouncementsActions.showModal, dispatch),
    hideModal : bindActionCreators(AnnouncementsActions.hideModal, dispatch),
    confirmDeleteAnnouncement : bindActionCreators(AnnouncementsActions.deleteAnnouncement, dispatch),
    showAnnouncementDetails: function (announcement){
      dispatch(AnnouncementsActions.showAnnouncementDetails(event, announcement));
    },
    goBack: bindActionCreators(AnnouncementsActions.goBack, dispatch),
  };
}

Announcements.icon = 'wechat';
Announcements.title = 'Section.Messages.Announcements.Title';
module.exports = connect(mapStateToProps, mapDispatchToProps)(Announcements);
