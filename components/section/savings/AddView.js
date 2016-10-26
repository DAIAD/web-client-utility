var React = require('react');
var bs = require('react-bootstrap');
var Modal = require('../../Modal');
var Wizard = require('../../common/Wizard');
var { SetNameItem, WhoItem, WhereItem, WhenItem } = require('../../common/WizardReusableItems');

function ValidationError (props) {
  const { validationError, setValidationError } = props;
  if (validationError == null) {
    return <div/>;
  }
  const reset = () => setValidationError(null);
  return (
    <Modal
        title='Validation Error'
        show={true}
        text={validationError}
        onClose={reset}
        actions={[
          {
            name: 'OK',
            action: reset,
          }]}
      />
  );
}


function SavingsPotentialAdd (props) {
  const { groups, clusters, segments, areas, actions, validationError } = props;
  const { setValidationError, addSavingsScenario, goToListView } = actions;
  return (
    <div>
      <bs.Row>
      <bs.Col md={6}>
        <h4>Add new Scenario</h4> 
      </bs.Col>
      <bs.Col md={6} style={{textAlign: 'right'}}>
        <bs.Button bsStyle='success' onClick={() => { goToListView(); }}><i className='fa fa-chevron-left'></i> Back to all</bs.Button>
      </bs.Col>
    </bs.Row>
    <hr/>
      <Wizard
        showAll={true}
        showPrevious={false}
        onValidationFail={(err) => { setValidationError(err); }}
        onComplete={(values) => { addSavingsScenario(values); goToListView(); }}
        onReset={() => {setValidationError(null); }}
        > 
        <WhoItem
          id='who'
          title='Who'
          description='Select all population or narrow savings potential calculation to selected groupsn'
          groups={groups}
          clusters={clusters}
        />
        <WhereItem
          id='where'
          title='Where'
          description='Select all areas or narrow savings potential calculation to selected areas'
          clusters={segments}
          groups={areas}
        />
        <WhenItem
          id='when'
          title='Data'
          description='Data to be used for savings potential calculation, last year or custom'
        />
        <SetNameItem
          title='Name'
          description='Select a descriptive name for your scenario'
          id='name'
        />
      </Wizard>


      <ValidationError
        validationError={validationError}
        setValidationError={setValidationError}
      />

  </div>
  );
}

module.exports = SavingsPotentialAdd;
