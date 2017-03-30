const React = require('react');
const { observable } = require('mobx');
const { observer } = require('mobx-react');
const { Tab, Tabs } = require('~/react-toolbox');
const { t } = require('peerio-translator');

const ROUTES = [
    '/app/settings/profile',
    '/app/settings/security',
    // '/app/settings/preferences',
    '/app/settings/about'
];

const ROUTES_MAP = ROUTES.reduce((map, route, ind) => { map[route] = ind; return map; }, {});

@observer
class Settings extends React.Component {
    @observable index = ROUTES_MAP[window.router.getCurrentLocation().pathname];

    componentWillMount() {
        this.disposeRouterListener = window.router.listen(this.handleRouteChange);
    }

    componentWillUnmount() {
        if (this.disposeRouterListener) this.disposeRouterListener();
    }

    handleRouteChange = route => {
        this.index = ROUTES_MAP[route.pathname];
    };

    handleTabChange = (index) => {
        window.router.push(ROUTES[index]);
    };

    render() {
        return (
            <div className="flex-row flex-justify-center settings">
                <div className="tab-wrapper">
                    <div className="headline">
                        {t('title_settings')}
                    </div>
                    <Tabs index={this.index}
                          onChange={this.handleTabChange}
                          style={{ width: '1024px' }}
                          className="tabs">
                        <Tab label={t('title_settingsProfile')} />
                        <Tab label={t('title_settingsSecurity')} />
                        {/* <Tab label={t('title_settingsPreferences')} />*/}
                        <Tab label={t('title_settingsAbout')} />
                    </Tabs>
                    {this.props.children}
                </div>
            </div>
        );
    }
}

module.exports = Settings;
