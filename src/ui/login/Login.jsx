/* eslint-disable jsx-a11y/no-static-element-interactions*/
const React = require('react');
const { Component } = require('react');
const { Button, IconButton, Tooltip } = require('~/react-toolbox');
const { config, socket, User, validation } = require('~/icebear');
const { observable, computed } = require('mobx');
const { observer } = require('mobx-react');
const { t } = require('peerio-translator');
const { Link } = require('react-router');
const ValidatedInput = require('~/ui/shared-components/ValidatedInput');
const FullCoverLoader = require('~/ui/shared-components/FullCoverLoader');
const T = require('~/ui/shared-components/T');
const OrderedFormStore = require('~/stores/ordered-form-store');
const Snackbar = require('~/ui/shared-components/Snackbar');
const css = require('classnames');

const { validators } = validation; // use common validation from core

const TooltipIcon = Tooltip()(IconButton); //eslint-disable-line

class LoginStore extends OrderedFormStore {
    @observable fieldsExpected = 2;

    // also has observables usernameValid, usernameDirty created by ValidatedInput
    @observable username = '';
    @observable passcodeOrPassphrase = '';

    // non ValidatedInput-enhanced observables
    @observable busy = false;
    @observable passwordVisible = false;
    @observable lastAuthenticatedUser = undefined;

    @computed get hasErrors() {
        return !(
                this.initialized &&  // store has its input properties
                this.usernameValid && this.passcodeOrPassphraseValid && // fields ok
                socket.connected // server is available
        );
    }
}

@observer class Login extends Component {

    constructor() {
        super();
        this.loginStore = new LoginStore();
    }

    componentDidMount() {
        User.getLastAuthenticated()
            .then((lastUserObject) => {
                if (config.autologin) {
                    this.loginStore.username = config.autologin ? config.autologin.username : '';
                    this.loginStore.passcodeOrPassphrase = config.autologin ? config.autologin.passphrase : '';
                    return;
                }
                if (lastUserObject) {
                    this.loginStore.lastAuthenticatedUser = lastUserObject;
                    this.loginStore.username = lastUserObject.username;
                }
            });
    }


    togglePasswordVisibility = () => {
        this.loginStore.passwordVisible = !this.loginStore.passwordVisible;
    };

    unsetLastUser = () => {
        return User.removeLastAuthenticated()
            .then(() => {
                this.loginStore.lastAuthenticatedUser = undefined;
                this.loginStore.username = undefined;
            });
    };

    login = () => {
        if (this.loginStore.busy || this.loginStore.hasErrors) return;
        this.loginStore.busy = true;
        const user = new User();
        user.username = this.loginStore.username || this.loginStore.lastAuthenticatedUser.username;
        user.passphrase = this.loginStore.passcodeOrPassphrase;
        user.login().then(() => {
            User.current = user;
            window.router.push('/app');
        }).catch(() => {
            // show error inline
            this.loginStore.passcodeOrPassphraseValidationMessageText = t('error_loginFailed');
            this.loginStore.busy = false;
        });
    };

    handleKeyPress =(e) => {
        if (e.key === 'Enter') {
            this.login();
        }
    };

    getWelcomeBlock = () => {
        return (
            <div className="welcome-back-wrapper">
                <div className="welcome-back" onClick={this.unsetLastUser}>
                    <div className="overflow ">{t('title_welcomeBack')}&nbsp;
                        <strong>
                            {this.loginStore.lastAuthenticatedUser.firstName
                            || this.loginStore.lastAuthenticatedUser.username}
                        </strong>
                    </div>
                    <div className="subtitle">
                        <div className="overflow">
                            <T k="button_changeUserDesktop">
                                {{ username: (this.loginStore.lastAuthenticatedUser.firstName
                                                || this.loginStore.lastAuthenticatedUser.username) }}
                            </T>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    render() {
        return (
            <div className="flex-row app-root">
                <FullCoverLoader show={this.loginStore.busy} />
                <div className="flex-row login rt-light-theme">
                    <img alt="" className="logo" src="static/img/logo-white.png" />

                    {this.loginStore.lastAuthenticatedUser ? this.getWelcomeBlock() : ''}
                    <div className="login-form">
                        <div className={css('headline', { hide: this.loginStore.lastAuthenticatedUser })}>
                            {t('title_login')}
                        </div>
                        <ValidatedInput label={t('title_username')}
                                        name="username"
                                        position="0"
                                        lowercase="true"
                                        store={this.loginStore}
                                        validator={validators.usernameLogin}
                                        onKeyPress={this.handleKeyPress}
                                       className={css({ hide: this.loginStore.lastAuthenticatedUser })} />
                        <div className="password">
                            <ValidatedInput type={this.loginStore.passwordVisible ? 'text' : 'password'}
                                            label={t('title_password')}
                                            position="1"
                                            store={this.loginStore}
                                            validator={validators.stringExists}
                                            name="passcodeOrPassphrase"
                                            onKeyPress={this.handleKeyPress} />
                            <TooltipIcon icon={this.loginStore.passwordVisible ? 'visibility_off' : 'visibility'}
                                         tooltip={this.loginStore.passwordVisible ? 'hide password' : 'show password'}
                                         tooltipPosition="right"
                                         tooltipDelay={500}
                                         onClick={this.togglePasswordVisibility} />
                        </div>
                        {/* <Dropdown value={languageStore.language}
                                  source={languageStore.translationLangsDataSource}
                                  onChange={languageStore.changeLanguage} /> */}
                    </div>
                    <Button className="login-button" label={t('button_login')} flat
                            onClick={this.login}
                            disabled={this.loginStore.hasErrors} />

                    <div>{t('title_newUser')} &nbsp; <Link to="/signup">{t('button_signup')}</Link></div>
                </div>
                <Snackbar location="login" />
            </div>
        );
    }
}


module.exports = Login;
