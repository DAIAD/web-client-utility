var React = require('react');
var bs = require('react-bootstrap');
var echarts = require('react-echarts');
var { FormattedTime } = require('react-intl');

var Widget = require('../../WidgetComponent');
var Modal = require('../../Modal');
var theme = require('../../chart/themes/blue');

function ExploreBudget (props) {
  const { budget, clusters, groups, actions } = props;
  const { confirmSetBudget, confirmResetBudget, goToActiveView } = actions;
  const { id, name, potential, user, createdOn, completedOn, activatedOn, parameters, paramsLong, params, active } = budget;
  const goal = parameters.goal;
  const completed = budget.completedOn != null;

  const widgets = [{
    id: 1,
    display: 'stat',
    title: 'Details',
    highlight: goal && goal.values ? goal.values.label : null,
    info: [
      <span><b>Created by:</b> { user } </span>,
      <span><b>Created on:</b> { createdOn ? <FormattedTime value={createdOn} minute='numeric' hour='numeric' day='numeric' month='numeric' year='numeric' /> : '-'}</span>,
      <span><b>Completed on:</b> { completedOn ? <FormattedTime value={completedOn} minute='numeric' hour='numeric' day='numeric' month='numeric' year='numeric' /> : '-'}</span>,
      <span><b>Activated on:</b> { activatedOn ? <FormattedTime value={activatedOn} minute='numeric' hour='numeric' day='numeric' month='numeric' year='numeric' /> : '-'}</span>,
    ]
  },
  {
    id: 2,
    display: 'stat',
    title: 'Parameters',
    highlight: null,
    info: params.map(p =>
      <span><b>{p.key}:</b> {p.value}</span>
    )
  }
  ];

  if (completed) {
    clusters.forEach((cluster, i) => {

      widgets.push({
        id: i + 3,
        display: 'chart',
        style: {
          height: 200,
          width: 300
        },
        yAxis: {
          formatter: y => y.toString() + '%',
        },
        xAxis: {
          name: cluster.label,
          data: groups.filter(g => g.cluster === cluster.value).map(x => x.label)
        },
        series: [
          {
            name: '',
            type: 'bar',
            fill: 0.8,
            data: groups.filter(g => g.cluster === cluster.value).map(x => Math.round(Math.random()*50))
          }
        ]
      });
    });
  }

  return (
    <div>
      <bs.Row>
      {
        !active && completed ? 
          <bs.Button 
            bsStyle='primary' 
            style={{float: 'right', marginRight: 25}}
            onClick={() => { confirmSetBudget(id);  }}
          >
            Set Budget
          </bs.Button>
          : <div />
      }
      {
        active && completed ?
          <div>            
            <span style={{ float: 'left', fontSize: '2em', marginLeft: 25 }}>Active</span>
            <bs.Button 
              bsStyle='danger' 
              style={{float: 'right', marginRight: 25}}
              onClick={() => { confirmResetBudget(id); }}
            >
              Reset Budget
            </bs.Button>

            <bs.Button 
              bsStyle='primary' 
              style={{float: 'right', marginRight: 25}}
              onClick={() => { goToActiveView(); }}
            >
              Monitor all active
            </bs.Button>
          </div>
          :
            <div />
      }
    </bs.Row>
    <bs.Row>
      {
        widgets.map((widget, i) => 
            <div key={widget.id} style={{float: 'left', width: '40%', margin: 20}}>
              <Widget {...widget} />
            </div>
        )
      }
      </bs.Row>
  </div> 
  );
}

var BudgetExplore = React.createClass({ 
  render: function() {
    const { budgets, groups, clusters, segments, areas, actions, params, budgetToSet, budgetToReset } = this.props;
    const { goToListView, confirmSetBudget, confirmResetBudget, setActiveBudget, resetActiveBudget } = actions;
    const { id } = params;
    const budget = budgets.find(budget => budget.id === parseInt(id));
    if (budget == null) {
      return (
        <bs.Panel header='Oops'>
          <bs.Row>
            <bs.Col md={6}>
              <h4>Sorry, budget not found.</h4>
            </bs.Col>
            <bs.Col md={6} style={{textAlign: 'right'}}>
              <bs.Button bsStyle='success' onClick={() => { goToListView(); }}><i className='fa fa-chevron-left'></i> Back to all</bs.Button>
            </bs.Col>
          </bs.Row> 
        </bs.Panel>
      );
    } 
    return (
      <bs.Panel header={`Explore ${budget.name}`}>
        <bs.Row>
          <bs.Col md={6}>
        </bs.Col>
        <bs.Col md={6} style={{textAlign: 'right'}}>
          <bs.Button bsStyle='success' onClick={() => { goToListView(); }}><i className='fa fa-chevron-left'></i> Back to all</bs.Button>
        </bs.Col>
      </bs.Row>
         <hr/>
        <ExploreBudget
          clusters={clusters}
          groups={groups}
          budget={budget}
          actions={actions}
        />

      {
        budgetToSet != null ? 
          <Modal
            show
            title='Confirmation'
            text={<span>Are you sure you want to <i>set</i> <b>{budgetToSet.name}</b> (id:{budgetToSet.id}) ?</span>}
            onClose={() => confirmSetBudget(null)}
            actions={[
              {
                name: 'Cancel',
                action: () => confirmSetBudget(null),
              },
              {
                name: 'Set Budget',
                style: 'primary',
                action: () => { setActiveBudget(budgetToSet.id); confirmSetBudget(null); }
              },
            ]}
          />
          :
            <div />
      }
      
      {
        budgetToReset != null ? 
          <Modal
            show
            title='Confirmation'
            text={<span>Are you sure you want to <i>reset</i> <b>{budgetToReset.name}</b> (id:{budgetToReset.id}) ?</span>}
            onClose={() => confirmResetBudget(null)}
            actions={[
              {
                name: 'Cancel',
                action: () => confirmResetBudget(null),
              },
              {
                name: 'Reset budget',
                style: 'danger',
                action: () => { resetActiveBudget(budgetToReset.id); confirmResetBudget(null); }
              },
            ]}
          />
          :
            <div />
      }
        </bs.Panel>
    );
  }
});

module.exports = BudgetExplore;
