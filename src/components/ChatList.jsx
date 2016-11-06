const React = require('react');
const { withRouter } = require('react-router');
const { t } = require('peerio-translator');
const { IconButton, List, ListItem, ListSubHeader, ProgressBar } = require('react-toolbox');
const {chatStore} = require('../icebear'); //eslint-disable-line
const { observer } = require('mobx-react');

@observer
class ChatList extends React.Component {
    componentWillMount() {
        chatStore.loadAllChats();
    }

    activateChat(id) {
        chatStore.activate(id);
    }

    newMessage = () => {
        this.props.router.push('/app/new-message');
    };
/* <ListItem caption="Bill" className="online" leftIcon="fiber_manual_record"
   rightIcon={<div className="notification">12</div>} />*/
    render() {
        // todo: remove arrow function event handler
        return (
            <div className="message-list">
                {chatStore.loading ? <ProgressBar type="linear" mode="indeterminate" /> : null}
                <List selectable ripple>
                    <div key="list-header" className="list-header-wrapper">
                        <ListSubHeader caption={t('directMessages')} />
                        <IconButton icon="add_circle_outline" onClick={this.newMessage} />
                    </div>
                    {chatStore.chats.map(c =>
                        <ListItem key={c.id || c.tempId} className={c.active ? 'active' : ''}
                            itemContent={c.loadingMeta
                                            ? <ProgressBar type="linear" mode="indeterminate" />
                                            : null}
                            onClick={() => this.activateChat(c.id)}
                                         caption={c.chatName} leftIcon="fiber_manual_record" />
                    )}
                </List>
            </div>
        );
    }
}


module.exports = withRouter(ChatList);
