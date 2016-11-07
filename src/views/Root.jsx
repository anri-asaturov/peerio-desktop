const React = require('react');
const AutoUpdateDialog = require('../components/AutoUpdateDialog');
const languageStore = require('../stores/language-store');
const { reaction } = require('mobx');

class Root extends React.Component {

    constructor() {
        super();
        languageStore.loadSavedLanguage();
        this.onLanguageChange = reaction(
            () => languageStore.language,
            () => {
                this.forceUpdate();
            }
        );
        this.devtools = null;
        if (process.env.NODE_ENV !== 'production') {
            const MobxTools = require('mobx-react-devtools').default; //eslint-disable-line
            this.devtools = <MobxTools />;
            window.hideMobxTools = () => {
                this.devtools = null;
                this.forceUpdate();
            };
            window.showMobxTools = () => {
                this.devtools = <MobxTools />;
                this.forceUpdate();
            };
        }
    }

    componentWillUnmount() {
        this.onLanguageChange();
    }

    render() {
        return (
            <div>
                {this.props.children}
                <AutoUpdateDialog />
                {this.devtools}
            </div>
        );
    }
}

Root.propTypes = {
    children: React.PropTypes.element.isRequired
};

module.exports = Root;
