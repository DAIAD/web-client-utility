var React = require('react');
var ReactDOM = require('react-dom');

var {FormattedMessage, FormattedTime, FormattedDate} = require('react-intl');
var { Link } = require('react-router');

var Bootstrap = require('react-bootstrap');
var Checkbox = require('./Checkbox');
var IndeterminateCheckbox = require('./IndeterminateCheckbox');

var Helpers = require('../helpers/helpers');


var EditTable = React.createClass({
	
	getInitialState: function() {
		return {
			//activePage: 0,
    	};
	},
	
	onPageIndexChange(event, selectedEvent) {
		this.props.setActivePage(selectedEvent.eventKey - 1);
	},
	
	_computeModesState: function (data){
		var modesState = {};
		var propertyNames = Helpers.pluck(
						Helpers.pickQualiffied(data.fields, 'type', 'property'),
						'name'
					);
		var self = this;
		var rowIds = Helpers.pluck(data.rows, 'id');
		
		for (var i = 0, len = rowIds.length; i < len; i++){
			var modeEntry = {};
			modeEntry.active = data.rows[i].active;
			modeEntry.modes = {};
			for (var p = 0, len2 = propertyNames.length; p < len2; p++){
				var mode = {
					value: data.rows[i][propertyNames[p]],
					draft: false
				};
				modeEntry.modes[propertyNames[p]] = mode;
			}
			modesState[rowIds[i]] = modeEntry;
		}
		return modesState;
	},

	_syncStateData: function (){
		var syncdData = this.props.data;
		var syncdRows = syncdData.rows;
		var self = this;
		for (var r = 0, len = syncdRows.length; r < len; r++){
			var row = syncdRows[r];
			for (var m in self.props.modes[row.id].modes){

				if(self.props.modes[row.id].modes.hasOwnProperty(m)){
					row[m] = self.props.modes[row.id].modes[m].value;
				}
			}
		}
		syncdData.rows = syncdRows;	
		return syncdData;
	},
	
	_getVisibleCellsDraftFlags: function(visibleRows){
		var visibleCellDraftFlags = {};
  		var self = this;
  		for (var r = 0, len = visibleRows.length; r < len; r++){
			var row = visibleRows[r];
  			var rowDraftFlags = {};
  			for (var m in self.props.modes[row.id].modes){
  				rowDraftFlags[m] = self.props.modes[row.id].modes[m].draft;
  			}
  			visibleCellDraftFlags[row.id] = rowDraftFlags;
  		}
  		return visibleCellDraftFlags;
	},
	
	handleCheckboxChange: function (rowId, propertyName, currentValue){
		var currentModesState = Object.assign({}, this.props.modes);
		currentModesState[rowId].modes[propertyName] = {
				value: !this.props.modes[rowId].modes[propertyName].value,
				draft: !this.props.modes[rowId].modes[propertyName].draft								  
		};
		this.props.setModes(currentModesState);
	},
	
	toggleCheckBoxes: function (propertyName, toggleState){	
		var visibleRowIds = [];
		for (var i = 0; i<this.props.data.rows.length ; i++){
			visibleRowIds.push(this.props.data.rows[i].id);
		}
		
		var currentModesState = Object.assign({}, this.props.modes);
		switch(toggleState) {
		case 'indeterminate':
			for (let r = 0, len = visibleRowIds.length; r < len; r++){
				let rowId = visibleRowIds[r];
				if(currentModesState[rowId].active === true){
					if (currentModesState[rowId].modes[propertyName].draft === true) {
						currentModesState[rowId].modes[propertyName] = {
								value: !currentModesState[rowId].modes[propertyName].value,
								draft: false								  
						};
					}
				}
			}
			break;
		case 'selectAll':
			for (let r = 0, len = visibleRowIds.length; r < len; r++){
				let rowId = visibleRowIds[r];
				if(currentModesState[rowId].active === true){
					currentModesState[rowId].modes[propertyName] = {
						value: true,
						draft: (currentModesState[rowId].modes[propertyName].value === 
							currentModesState[rowId].modes[propertyName].draft) ? true : false
					};
				}
			}
			break;
		case 'unSelectAll':
			for (var r = 0, len = visibleRowIds.length; r < len; r++){
				let rowId = visibleRowIds[r];
				if(currentModesState[rowId].active === true){
					currentModesState[rowId].modes[propertyName] = {
							value: false,
							draft: (currentModesState[rowId].modes[propertyName].value === 
								currentModesState[rowId].modes[propertyName].draft) ? false : true
					};
				}
			}
			break;
		}
		this.props.setModes(currentModesState);
	},
	  
	getDefaultProps: function() {
		return {
			data: {
				fields: [],
				rows: [],
				pager: {
					index: 0,
					size: 10
				}
			}
		};
	},

	suspendUI: function() {
		this.setState({ loading : false});
  	},
  	
  	resumeUI: function() {
  		this.setState({ loading : true});
  	},
  	
  	saveModeChanges: function(){
  		this.props.saveAction(this._getChangedRows());
  	},
  	
  	_countChangedRows: function(){
		var cnt = 0;
		for (var r in this.props.modes){
			if(this.props.modes.hasOwnProperty(r)){
				let row = this.props.modes[r];
				for (var p in row.modes){
					if(row.modes.hasOwnProperty(p)){
						let mode = row.modes[p];
						if(mode.draft === true){
							cnt = cnt + 1;
							break;
						}
					}
				}
			}
		}
		return cnt;
	},
	
	_getChangedRows: function(){
		var changedRows = [];
		for (var r in this.props.modes){
			let row = this.props.modes[r];
			for (var p in row.modes){
				if(row.modes.hasOwnProperty(p)){
					let property = row.modes[p];
					if(property.draft === true){
						changedRows.push({
							id: r,
							modes: row.modes
						});
						break;
					}
				}
			}
		}
		return changedRows;
	},

  	render: function() {
  		console.log('RENDERING EditTable....................');
  		var self = this;
  		var visibleData = Object.assign({}, 
  				this._syncStateData(this.props.data),
  				{rows: this.props.data.rows.slice(
  						this.props.activePage * this.props.data.pager.size, 
  						(this.props.activePage + 1) * this.props.data.pager.size)
  				}
  		);
  		var numberOfPages = Math.ceil(this.props.data.rows.length / this.props.data.pager.size); 
  		var saveButton;  		
  		if (this._countChangedRows() > 0){
  			saveButton = (
  				<div className='pull-left' style={{ marginTop : 20, marginBottom : 20}}>
  					<button id='logout'
  		   				type='submit'
  		   				className='btn btn-primary'
  							style={{ height: 33 }}
  							onClick={this.saveModeChanges}>
  		   				<FormattedMessage id='Table.Save' />
  		   			</button>
  				</div>
  			);
  		}

  		return (
			<div className='clearfix'>
				<Bootstrap.Table hover style={{margin: 0, padding: 0}}>
					<EditTable.Header data = {this.props.data}
								  toggleCheckBoxes = {this.toggleCheckBoxes}>
					  </EditTable.Header>
					<EditTable.Body data = {visibleData}
								draftFlags = {this._getVisibleCellsDraftFlags(visibleData.rows)}
								checkboxHandler = {this.handleCheckboxChange}></EditTable.Body>			
				</Bootstrap.Table>
				{saveButton}
				<div style={{float:'right'}}>
					<Bootstrap.Pagination 	prev
											next
											first
											last
											ellipsis
											items={numberOfPages}
			        						maxButtons={7}
			        						activePage={this.props.activePage + 1}
			        						onSelect={this.onPageIndexChange} />	
				</div>
			</div>
 		);
  	}
});

var Header = React.createClass({
	contextTypes: {
	    intl: React.PropTypes.object
	},

  	render: function() {	
  		var _t = this.context.intl.formatMessage;
  		var self = this;

		var header = this.props.data.fields.filter((f) => { return !!!f.hidden; }).map(function(field) {
			switch(field.type ) {
				case 'action':
					return (
						<th key={field.name} style={{ width: 24 }}>{field.title ? _t({ id: field.title}) : ''}</th>
					);
				case 'boolean':
					return (
						<th key={field.name} style={{ width: 90 }}>{field.title ? _t({ id: field.title}) : ''}</th>
					);
				case 'property':
					return (
						<th key={field.name} style={{ width: 90 }}>
							<IndeterminateCheckbox 
			  					propertyName={field.name}
			  					checked={true} 
								disabled={false}
								action={self.props.toggleCheckBoxes}
							/>
							{field.title ? _t({ id: field.title}) : ''}
						</th>
					);
			}

			return (
				<th key={field.name}>{field.title ? _t({ id: field.title}) : ''}</th>
			);
		});
		
  		return (
			<thead>
				<tr>
					{header}
				</tr>	
			</thead>
 		);
  	}
});

var Body = React.createClass({
  	render: function() { 		
  		var self = this;
		var rows = this.props.data.rows.map(function(row, rowIndex) {
			return (
				<EditTable.Row 	key={rowIndex} 
							fields={self.props.data.fields} 
							row={row}
							draftFlags={self.props.draftFlags[row.id]}
							checkboxHandler={self.props.checkboxHandler}>
				</EditTable.Row>
			);
		});
		
  		return (
			<tbody>
				{rows}
			</tbody>
 		);
  	}
});

var Row = React.createClass({
  	render: function() {
  		var self = this;
  		
  		return (
			<tr>
				{
					this.props.fields.filter((f) => { return !!!f.hidden; }).map(function(field, columnIndex) {
						return (
							<EditTable.Cell key={columnIndex} 
										row={self.props.row} 
										field={field}
										draftFlag={self.props.draftFlags[field.name]}
										checkboxHandler={self.props.checkboxHandler}>
							</EditTable.Cell>
						);
					})
				}
			</tr>
		);
  	}
});

var formatLink = function(route, row) {
	return Object.keys(row).reduce(function(link, key) {
		return link.replace(new RegExp('\{' + key + '\}'), row[key]);
	}, route);
};

var Cell = React.createClass({
  	render: function() {
  		var rowId = this.props.row.id;

  		var value = this.props.row[this.props.field.name];
  		var disabled = !this.props.row.active;
  		var text;
  		
  		if (disabled)
  			text = (<span className="disabled">{value}</span>);
  		else
  			text = (<span>{value}</span>);
  		 		
  		if(this.props.field.hasOwnProperty('type')) {
  			switch(this.props.field.type) {
  			case 'action':
  				if (disabled) {
  					text = (<i className={'fa fa-' + this.props.field.icon + ' fa-fw disabled-icon'}></i>);
  				}
  				else {
  					text = (<i className={'fa fa-' + this.props.field.icon + ' fa-fw table-action'} onClick={this.props.field.handler.bind(this)}></i>);
  				}
  				break;
  			case 'datetime':
  				if(value) {
  					text = (<FormattedTime 	value={value} 
  										day='numeric' 
  										month='numeric' 
  										year='numeric'
  										hour='numeric' 
  										minute='numeric' />);
  				} else {
  					text = '';
  				}
  				break;
  			case 'time':
  				text = (<FormattedTime 	value={value} 
										hour='numeric' 
										minute='numeric' />);
  				break;
  			case 'progress':
  				if(value !== null) {
  					text = (<Bootstrap.ProgressBar now={value} label="%(percent)s%" />);
  				} else {
  					text = (<span />);
  				}
  				break;
  			case 'boolean':
  				text = (<Checkbox checked={value} disabled={true} />);
  				break;
			case 'property':
  				text = (<Checkbox checked={value} 
  								disabled={disabled} 
  								rowId={rowId}
  								propertyName={this.props.field.name}
  								draftFlag={this.props.draftFlag}
  								onUserClick={this.props.checkboxHandler}/>);
  				break;
  			case 'date':
  				text = (<FormattedDate value={value} day='numeric' month='long' year='numeric' />);
  				break;
			default:
				console.log('Cell type [' + this.props.field.type + '] is not supported.');
				break;
  			}
  		} else {
	  		if(value instanceof Date) {
	  			text = (<FormattedDate value={value} day='numeric' month='long' year='numeric' />);
	  		} else if(typeof value === 'boolean') {
	  			text = (<Checkbox checked={value} disabled={true} />);
	  		}
  		} 

  		if(this.props.field.hasOwnProperty('link')) { 	
  			if(typeof this.props.field.link === 'function') {
  				console.log(this.props.field.link(this.props.row));
  				text = (<Link to={formatLink(this.props.field.link(this.props.row), this.props.row)}>{text}</Link>);
  			} else {
  				text = (<Link to={formatLink(this.props.field.link, this.props.row)}>{text}</Link>);
  			}
  			
  		}

  		if(typeof this.props.field.className === 'function') {
  			return (
				<td className={this.props.field.className(value)}>{text}</td>
			);	
  		}
  		
  		if(this.props.field.hasOwnProperty('align')) {
  			return (
  					<td style={{ textAlign: this.props.field.align}}>{text}</td>
  				);
  		}

		return (
			<td>{text}</td>
		);
  	}
});

EditTable.Header = Header;

EditTable.Body = Body;

EditTable.Row = Row;

EditTable.Cell = Cell;

module.exports = EditTable;

