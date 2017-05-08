var React = require('react');
var { bindActionCreators } = require('redux');
var { connect } = require('react-redux');
var bs = require('react-bootstrap');
var { Link } = require('react-router');
var Table = require('../../Table');
var { FormattedDate } = require('react-intl');

var Widget = require('../../Widget');

var ActiveBudgets = React.createClass({ 
  componentWillMount: function () {
    this.props.actions.fetchActiveBudgets(); 
  },
  render: function() {
    const { active, actions } = this.props;
    const { goToListView } = actions;

    //TODO: have to unify this with Explore view widgets handling
    // leaving as is for now for mockup purposes
    const budgets = active
    .map(budget => {
      const { activatedOn, createdOn, completedOn, parameters, params, user, updatedOn, expectation = {}, actual = {}, overlap = null, numberOfConsumers } = budget;
      const completed = completedOn != null;
      const active = activatedOn != null;
      const lastYear = 2015;
      const activeFor = 5.5;

      const widgets = [{
        id: 1,
        display: 'stat', 
        title: 'Budget goal',
        highlight: expectation.savings ? `${expectation.savings}%` : '-', 
        info: [{
          value: <span><b>{`${expectation.budget || '-'} lt`}</b> {`${expectation.budget < 0 ? 'less' : 'more'} than ${lastYear}`}</span>
        },
        {
          value: <span><b>{`Max ${expectation.max || '-'}% | Min ${expectation.min || '-'}%`}</b></span>
        },
        {
          value: <span><b>{`${numberOfConsumers} Consumers`}</b></span>
        }],
        footer: <span>{ activatedOn ? <span>Set: <FormattedDate value={activatedOn} day='numeric' month='numeric' year='numeric' /></span> : 'Inactive'}</span>,

      },
      { 
        id: 2,
        display: 'stat',
        title: 'Savings',
        highlight: actual.savings ?  `${actual.savings}%` : '-',
        info: [{
          value: <span><b>{`${actual.budget || '-'} lt`}</b> {`${actual.budget ? (actual.budget < 0 ? 'less' : 'more') : '-'} than ${lastYear}`}</span>
        },
        {
          value: <span><b>{`Max ${actual.max || '-'}% | Min ${actual.min || '-'}%`}</b></span>
        },
        {
          value: <span><b>{`Active for ${activeFor} months`}</b></span>
        }],
        footer: updatedOn ? <span>Updated: <FormattedDate value={updatedOn} day='numeric' month='numeric' year='numeric' /></span> : <span>Not estimated yet</span>,
       
      }];

      if (overlap) {
        widgets.push({
          id: 3,
          display: 'stat',
          title: 'Consumers',
          highlight: `${overlap.savings}%`,
          info: [{
            value: <span><b>{`${overlap.original - overlap.current} consumers changed to other budgets`}</b></span>
          },
          {
            value: <b>Original: {overlap.original}</b>
          },
          {
            value: <b>Current: {overlap.current}</b>,
          },
          ],
          footer: updatedOn ? <span>Updated: <FormattedDate value={updatedOn} day='numeric' month='numeric' year='numeric' /></span> : <span>Not estimated yet</span>,
        
        })
      }
      else {
        widgets.push({
          id: 3,
          display: 'stat',
          title: 'Consumers',
          highlight: 'No change',
          info: null,
          footer: updatedOn ? <span>Updated: <FormattedDate value={updatedOn} day='numeric' month='numeric' year='numeric' /></span> : <span>Not estimated yet</span>,
          style: {
            color: '#666',
            textAlign: 'center',
            paddingTop: 20
          }
        })
      }
      return {
        name: budget.name,
        key: budget.key,
        widgets
      };
    });

    return (
      <bs.Panel header={<h3>Active budgets</h3>}>
        <bs.Row>
          <bs.Col md={12} style={{textAlign: 'right'}}>
            <bs.Button bsStyle='success' onClick={() => { goToListView(); }}><i className='fa fa-chevron-left'></i> Back to all</bs.Button>
          </bs.Col>
        </bs.Row>
        <hr />
        { budgets.length === 0 ?
          <h4>No active budgets</h4>
          :
          <span />
        }
        {
        budgets.map((budget, i) =>  
          <bs.Row key={i} style={{ marginBottom: 10 }} >
            <Link to={`/budgets/${budget.key}`}><h3 style={{ marginLeft: 20, marginTop: 0 }}>{budget.name}</h3></Link>
            {
              budget.widgets.map(widget => (
                <bs.Col md={4}
                  key={widget.key} 
                  >
                  <Widget {...widget} />
              </bs.Col>
              ))
            }
          </bs.Row>
          )
      }
    </bs.Panel>
    );
  }
})

module.exports = ActiveBudgets;
