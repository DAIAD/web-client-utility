const React = require('react');
const Bootstrap = require('react-bootstrap');
const { FormattedMessage } = require('react-intl');
const ReCAPTCHA = require('react-google-recaptcha');

const validatePassword = function (username, password, confirmPassword) {
  if (!username) {
    throw new Error('noUsername');
  }
  if (!password) {
    throw new Error('noPassword');
  } else if (password !== confirmPassword) {
    throw new Error('passwordMismatch');
  } else if (password.length < 8) {
    throw new Error('passwordTooShort');
  }
  return Promise.resolve();
};


function ChangePasswordModal(props) {
  const { _t, show, username, password, confirmPassword, captcha, error, ...actions } = props;
  const {changePassword, hideChangePasswordModal, updateChangePasswordForm, setErrorChangePasswordForm} = actions;

  return (
    <Bootstrap.Modal
      animation={false}
      backdrop="static"
      show={show}
      onHide={hideChangePasswordModal}
    >
      <form
        id="form-change-password"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            validatePassword(username, password, confirmPassword)
              .then(() => {
                changePassword(username, password, captcha)
                  .then(result => {
                    hideChangePasswordModal();
                  })
                  .catch(error => {
                    setErrorChangePasswordForm(`Error.${error.message}`);
                  });
              });
          } catch (error) {
            setErrorChangePasswordForm(`ChangePasswordForm.Errors.${error.message}`);
          }
        }}
        autoComplete="form-change-password"
      >
        <Bootstrap.Modal.Header closeButton>
          <Bootstrap.Modal.Title>
            <FormattedMessage id="ChangePasswordForm.title" /><span> : {username} </span>
          </Bootstrap.Modal.Title>
        </Bootstrap.Modal.Header>
        <Bootstrap.Modal.Body>
          <div>
            <Bootstrap.Input
              id="password"
              type="password"
              name="password"
              label={_t({id :'ChangePasswordForm.password'})}
              value={password}
              onChange={e => updateChangePasswordForm({ password: e.target.value })}
              autoComplete="off"
            />
            <Bootstrap.Input
              id="password-confirm"
              type="password"
              name="password-confirm"
              label={_t({id :'ChangePasswordForm.password-confirm'})}
              value={confirmPassword}
              onChange={e => updateChangePasswordForm({ confirmPassword: e.target.value })}
              autoComplete="off"
            />

            <div className="form-group form-captcha">
              <ReCAPTCHA
                sitekey={properties.captchaKey}
                theme="light"
                onChange={value => updateChangePasswordForm({ captcha: value })}
              />
            </div>

            {error && 
              <p className="alert-danger" style={{ padding: 10, borderRadius: 4 }}>
                <FormattedMessage id={error} />
              </p>
            }
          </div>

        </Bootstrap.Modal.Body>
        <Bootstrap.Modal.Footer>
          <Bootstrap.Row>
            <Bootstrap.Col xs={6} className="text-left">
              <Bootstrap.Button onClick={hideChangePasswordModal}>
                {_t({ id:'ChangePasswordForm.cancel'})}
              </Bootstrap.Button>
            </Bootstrap.Col>
            <Bootstrap.Col xs={6}>
              <Bootstrap.Button bsStyle='success' type="submit">
                {_t({ id:'ChangePasswordForm.update'})}
              </Bootstrap.Button>
            </Bootstrap.Col>
          </Bootstrap.Row>
        </Bootstrap.Modal.Footer>
      </form>
    </Bootstrap.Modal>
  );
}

module.exports = ChangePasswordModal;
