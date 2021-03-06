var React = require('react');
var Bootstrap = require('react-bootstrap');
var UtilityDropDown = require('../UtilityDropDown');
var ManageAlertsActions = require('../../actions/ManageAlertsActions');
var { connect } = require('react-redux');
var { bindActionCreators } = require('redux');
var TipsEditTable = require('../TipsEditTable');
var {FormattedMessage} = require('react-intl');
var Schema = require('../../constants/ManageAlertsTableSchema');
var { cancelAddTip, showAddTipForm, beganEditingTip } = require('../../actions/ManageAlertsActions');
var Modal = require('../Modal');

var self;

var ManageAlerts = React.createClass({
  changedModes: [],
  contextTypes: {
    intl: React.PropTypes.object
  },
  getDefaultProps: function() {
    return {
        defaultDropDownTitle: 'Select Utility',
        rowsChanged : [],
        saveButtonDisabled : true
    };
  },
  componentWillMount : function() {
    this.props.fetchUtilities();
  },

  editClickedTip : function(tip) {
    this.props.editTip(tip);
  },

  validateNewTipForm: function(title, description, image){
    var errors = [];
    return errors;
  },

  processAddNewTipForm: function(){
    var inputFieldsFormValues = {
      title : this.refs.title.getValue(),
      description : this.description.lastName.getValue(),
      image : this.refs.image.getValue()
    };
    var errors = this.validateNewTipForm(
      this.refs.title.getValue(),
      this.refs.description.getValue(),
      this.refs.image.getValue()
    );
    if (errors.length === 0){
      this.props.actions.addTipFillForm(inputFieldsFormValues);
      var tipInfo = {
        title : this.refs.lastName.getValue(),
        description : this.refs.email.getValue(),
        image : this.refs.address.getValue() === '' ? null : this.refs.address.getValue(),
      };
      this.props.actions.addTip(tipInfo);
    } else {
      this.props.actions.addTipValidationsErrorsOccurred(errors);
    }
  },

  render: function() {
    self = this;

    if(this.props.showModal){
        var title = 'Delete Tip?';
           var actions = [{
              action: self.props.hideModal,
                name: "Cancel"
           },  {
              action: self.props.confirmDeleteTip,
                name: "Delete",
                style: 'danger'
               }
          ];

      return (
       <div>
            <Modal show = {this.props.showModal}
              onClose = {self.props.hideModal}
              title = {title}
              text = {'You are about to delete tip with ID ' + this.props.currentTip.index + ' permanently. Are you sure?'}
                actions = {actions}
            />
      </div>
      );
    }

    if (!this.props.isLoading && this.props.utilities){

     var fieldsData = [{
          name: 'index',
          title: 'Section.Engagement.Messages.Table1.Id'
        }, {
          name: 'title',
          title: 'Section.Engagement.Messages.Table1.Title'
        }, {
          name: 'description',
          title: 'Section.Engagement.Messages.Table1.Description'
        }, {
          name: 'createdOn',
          title: 'Section.Engagement.Messages.Table1.Created',
          type: 'datetime'
        }, {
          name: 'modifiedOn',
          title: 'Section.Engagement.Messages.Table1.Modified',
          type: 'datetime'
        },{
          name: 'active',
          title: 'Section.Engagement.Messages.Table1.Active',
          type: 'boolean',
          icon: 'check-square',
        }, {
          name: 'edit',
          type:'action',
          icon: 'pencil',
          handler: function() {
            self.editClickedTip(this.props.row);
          }
        }, {
          name: 'cancel',
          type:'action',
          icon: 'remove',
          handler: function() {
            self.props.setShowModal(this.props.row);
          }
        }];

      var data = {
        filters: Schema.filters,
        fields: fieldsData,
        rows: populateTips(this),
        pager: {
          index: 0,
          size: 8,
          count:1
        }
      };

      var utilityOptions = populateUtilityOptions(this.props.utilities);

      var filterTitle = (
        < span >
          < i className = 'fa fa-filter fa-fw' > < /i>
          < span style = {{ paddingLeft: 4 }} > Filter < /span>
            < span style = {{float: 'left', marginTop: - 3, marginLeft: 5 }} >
          < /span>
        < /span>
      );
      var filter = (
        < div className = "row" >
          < Bootstrap.Panel header = {filterTitle} >
            <UtilityDropDown
              title = {this.props.utility ? this.props.utility.label : this.props.defaultDropDownTitle}
              options={utilityOptions}
              disabled={false}
              onSelect={this.props.setUtility}
            />
            < /Bootstrap.Panel>
        < /div>
      );

      var staticTipsTitle = (
        < span >
          < i className = 'fa fa-commenting-o fa-fw' > < /i>
          < span style = {{ paddingLeft: 4 }} > Static Tips < /span>
            < span style = {{float: 'right', marginTop: - 3, marginLeft: 5 }} >
              < Bootstrap.Button  bsStyle = "default" className = "btn-circle" onClick={this.props.actions.showAddTipForm} >
                < Bootstrap.Glyphicon glyph = "plus" />
              < /Bootstrap.Button>
          < /span>
        < /span>
      );

      var table = (
        < div className = "row" >
         < Bootstrap.Panel header = {staticTipsTitle} >
           < Bootstrap.ListGroup fill >
             < Bootstrap.ListGroupItem >
                < TipsEditTable
                  data = {this.props.data ? this.props.data : data}
                  setActivePage={this.props.setActivePage}
                  activePage={this.props.activePage}
                  setActivationChanged={this.props.setActivationChanged}
                  initialRows={data}
                  saveActiveStatusAction={this.props.saveActiveStatusAction}
                  changedRows={this.props.changedRows}
                  currentTip={this.props.currentTip ? this.props.currentTip : null} >
               < /TipsEditTable>
             < /Bootstrap.ListGroupItem>
           < /Bootstrap.ListGroup>
         < /Bootstrap.Panel>
       < /div>
      );

      var tipsBody = (
        < div className = "container-fluid" style = {{ paddingTop: 10 }} >
          {filter}
          {table}
        < /div>
      );

      var tipFormTitle = (
        < span >
          < i className = 'fa fa-pencil fa-fw' > < /i>
          < span style = {{ paddingLeft: 4 }} > Edit < /span>
            < span style = {{float: 'left', marginTop: - 3, marginLeft: 5 }} >
          < /span>
        < /span>
      );

      var tipForm = (
        <div className = "row">
        <Bootstrap.Panel header = {tipFormTitle} >
          <Bootstrap.Row>
            <Bootstrap.Col xs={12}>
              <label>Title</label>
              <textarea name="Title"
                rows="2"
                style={{"resize": "none", "width": "100%"}}
                ref="title"
                index={this.props.currentTip ? this.props.currentTip.index : null}
                defaultValue={this.props.currentTip ? this.props.currentTip.title : ""}
              />
            </Bootstrap.Col>
          </Bootstrap.Row>
           <Bootstrap.Row>
            <Bootstrap.Col xs={12}>
              <label>Description</label>
              <textarea name="Description"
                style={{"resize": "none", "width": "100%"}}
                rows="8"
                ref="description"
                defaultValue={this.props.currentTip ? this.props.currentTip.description : ""}
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
                    style={{height: 33}}
                    onClick={this.props.saveCurrentTip}
                    disabled={this.props.saveTipDisabled} >
                  <FormattedMessage id='Section.Engagement.Messages.Button.Save' />
                </button>
                <button id='cancel'
                  label = 'Cancel'
                  type = 'cancel'
                  className = 'btn btn-primary'
                    style={{ height: 33, marginLeft : 10}}
                    onClick={this.props.actions.cancelAddTip}>
                  <FormattedMessage id='Section.Engagement.Messages.Button.Cancel' />
                </button>
              </div>
            </Bootstrap.Col>
          </Bootstrap.Row>
        </Bootstrap.Panel>
        </div>
        );

      var addTipForm = (
        < div className = "container-fluid" style = {{ paddingTop: 10 }} >
            {filter}
            {tipForm}
        < /div>
      );

      var visiblePart = this.props.show ? addTipForm : tipsBody; //lala

      return (
      <div className="container-fluid" style={{ paddingTop: 10 }}>
        {visiblePart}
      </div>);


    } else {
      return (
        <div>
          <img className='preloader' src='/assets/images/utility/preloader-counterclock.png' />
          <img className='preloader-inner' src='/assets/images/utility/preloader-clockwise.png' />
        </div>
      );
    }
  }
});

function populateUtilityOptions(utilities){
  var utilityOptions = [];
  for(var obj in utilities){
    var currentName, currentId, currentKey, currentLocale;
    for(var prop in utilities[obj]){
      if(prop == "name"){
        currentName = utilities[obj][prop];
      }
      else if(prop == "id"){
        currentId = utilities[obj][prop];
      }
      else if(prop == "key"){
        currentKey = utilities[obj][prop];
      }
      else if(prop == "locale"){
        currentLocale = utilities[obj][prop];
      }
    }
    var option = {label: currentName, value: currentId, key: currentKey, locale: currentLocale};
    utilityOptions.push(option);
  }
  return utilityOptions;
}

function populateTips(object){
  var element = {}, populatedTips = [];
  if(object.props.tips == null){
    return []; //admin has not selected a utility, return empty tips
  }
  else{
    for(var obj in object.props.tips){
      var currentId, currentIndex, currentTitle, currentDescription, currentModifiedOn, currentCreatedOn, currentActive;

      for(var prop in object.props.tips[obj]){
        if(prop == "id"){
            currentId = object.props.tips[obj][prop];
        }
        else if(prop == "index"){
            currentIndex = object.props.tips[obj][prop];
        }
        else if(prop == "title"){
            currentTitle = object.props.tips[obj][prop];
        }
        else if(prop == "description"){
            currentDescription = object.props.tips[obj][prop];
        }
        else if(prop == "createdOn"){
            currentCreatedOn = object.props.tips[obj][prop];
        }
        else if(prop == "modifiedOn"){
            currentModifiedOn = object.props.tips[obj][prop];
        }
        else if(prop == "active"){
            currentActive = object.props.tips[obj][prop];
        }
      }

      element = {id: currentId, index : currentIndex, title : currentTitle, description : currentDescription,
        createdOn : currentCreatedOn, modifiedOn : currentModifiedOn, active : currentActive};
      populatedTips.push(element);
    }

    populatedTips.sort(sortBy('index', true));

    return populatedTips;
  }
}

var sortBy = function(field, reverse){
   var key = function (x) {return x[field];};

   return function (a,b) {
    var keyA = key(a), keyB = key(b);
    return ( (keyA < keyB) ? -1 : ((keyA > keyB) ? 1 : 0) ) * [-1,1][+!!reverse];
   };
};

function mapStateToProps(state) {
  return {
    utility: state.alerts.utility,
    tips: state.alerts.tips,
    utilities: state.alerts.utilities,
    currentUtility : state.alerts.currentUtility,
    isLoading: state.alerts.isLoading,
    activePage: state.alerts.activePage,
    show: state.alerts.show,
    currentTip: state.alerts.currentTip,
    data: state.alerts.data,
    changedRows: state.alerts.changedRows,
    showModal: state.alerts.showModal
  };
}

function mapDispatchToProps(dispatch) {

  return {
    actions : bindActionCreators(Object.assign({}, {beganEditingTip, showAddTipForm, cancelAddTip}) , dispatch),
    editTip : bindActionCreators(ManageAlertsActions.editTip, dispatch),
    setShowModal : bindActionCreators(ManageAlertsActions.showModal, dispatch),
    hideModal : bindActionCreators(ManageAlertsActions.hideModal, dispatch),
    confirmDeleteTip : bindActionCreators(ManageAlertsActions.deleteTip, dispatch),
    setUtility: function (event, utility){
      dispatch(ManageAlertsActions.setUtility(utility));
      dispatch(ManageAlertsActions.getStaticTips(utility, self.props.activePage));
    },
    saveCurrentTip : function () {
    var newTip;
      if(self.props.currentTip == null){
        newTip = {title : self.refs.title.value, description : self.refs.description.value};
        dispatch(ManageAlertsActions.addTip(newTip, self.props.utility));
      }
      else{
        self.props.currentTip.title = self.refs.title.value;
        self.props.currentTip.description = self.refs.description.value;
        dispatch(ManageAlertsActions.addTip(self.props.currentTip));
      }
    },
    fetchUtilities : bindActionCreators(ManageAlertsActions.fetchUtilities, dispatch),
    setActivePage: function(activePage){
      dispatch(ManageAlertsActions.setActivePage(activePage));
    },
    setActivationChanged: function (newData){
      dispatch(ManageAlertsActions.setActivationChanged(newData));
    },
    saveActiveStatusAction: function (changedRows){
      dispatch(ManageAlertsActions.saveActiveStatusChanges(changedRows,self.props.utility, self.props.activePage));
    }
  };
}

ManageAlerts.icon = 'commenting-o';
ManageAlerts.title = 'Section.Engagement.Messages.Title';
module.exports = connect(mapStateToProps, mapDispatchToProps)(ManageAlerts);
