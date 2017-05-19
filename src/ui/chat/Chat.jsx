const React = require('react');
const { observable, reaction } = require('mobx');
const { observer } = require('mobx-react');
const { FontIcon, IconButton, TooltipIconButton, ProgressBar } = require('~/react-toolbox');
const ChatList = require('./components/ChatList');
const MessageInput = require('./components/MessageInput');
const MessageList = require('./components/MessageList');
const NoChatSelected = require('./components/NoChatSelected');
const { chatStore, TinyDb, clientApp } = require('~/icebear');
const sounds = require('~/helpers/sounds');
const uiStore = require('~/stores/ui-store');
const UploadInChatProgress = require('./components/UploadInChatProgress');
const { t } = require('peerio-translator');
const css = require('classnames');
const ChatSideBar = require('./components/ChatSideBar');
const ChatNameEditor = require('./components/ChatNameEditor');

const SIDEBAR_STATE_KEY = 'chatSideBarIsOpen';
@observer
class Chat extends React.Component {
    @observable static sidebarOpen = false; // static, so it acts like lazy internal store
    @observable chatNameEditorVisible = false;
    static sidebarStateSaver;
    componentWillMount() {
        clientApp.isInChatsView = true;
        TinyDb.user.getValue(SIDEBAR_STATE_KEY).then(isOpen => {
            Chat.sidebarOpen = !!isOpen;
        });
        if (!Chat.sidebarStateSaver) {
            Chat.sidebarStateSaver = reaction(() => Chat.sidebarOpen, open => {
                TinyDb.user.setValue(SIDEBAR_STATE_KEY, open);
            }, { delay: 1000 });
        }
    }

    componentWillUnmount() {
        clientApp.isInChatsView = false;
    }

    sendMessage(m) {
        chatStore.activeChat.sendMessage(m)
            .catch(() => Chat.playErrorSound());
    }

    sendAck() {
        chatStore.activeChat.sendAck()
            .catch(() => Chat.playErrorSound());
    }

    shareFiles = (files) => {
        chatStore.activeChat.shareFiles(files)
            .catch(() => Chat.playErrorSound());
    };

    static playErrorSound() {
        if (uiStore.prefs.errorSoundsEnabled) sounds.destroy.play();
    }

    toggleSidebar = () => {
        Chat.sidebarOpen = !Chat.sidebarOpen;
    };

    showChatNameEditor = () => {
        this.chatNameEditorVisible = true;
    };

    hideChatNameEditor = () => {
        this.chatNameEditorVisible = false;
    };

    chatNameEditorRef = ref => {
        if (ref) ref.nameInput.focus();
    };
    // assumes active chat exists, don't render if it doesn't
    renderHeader() {
        const chat = chatStore.activeChat;
        return (
            <div className="message-toolbar flex-justify-between">
                <div className="flex-col" style={{ width: '90%' }}>
                    <div className="title" onClick={this.showChatNameEditor}>
                        {
                            this.chatNameEditorVisible
                                ? <ChatNameEditor showLabel={false} className="name-editor"
                                    onBlur={this.hideChatNameEditor} ref={this.chatNameEditorRef} />
                                : <div style={{ overflow: 'hidden' }}>
                                    <FontIcon value="edit" />
                                    <div className="title-content">
                                        {chat.name}
                                    </div>
                                </div>
                        }
                    </div>
                    <div className="flex-row meta-nav">
                        {chat.changingFavState ? <ProgressBar type="circular" mode="indeterminate" /> :

                        <TooltipIconButton icon={chat.isFavorite ? 'star' : 'star_border'}
                                onClick={chat.toggleFavoriteState}
                                className={css({ starred: chat.isFavorite })}
                                tooltip={t('title_starChat')}
                                tooltipPosition="bottom"
                                tooltipDelay={500} />
                        }
                        <div className="member-count">
                            <TooltipIconButton icon="person"
                                tooltip={t('title_Members')}
                                tooltipPosition="bottom"
                                tooltipDelay={500}
                                onClick={this.toggleSidebar} />
                            {chat.participants && chat.participants.length ? chat.participants.length : ''}
                        </div>

                    </div>
                </div>
                <IconButton icon="chrome_reader_mode" onClick={this.toggleSidebar} />
            </div>
        );
    }
    render() {
        const chat = chatStore.activeChat;

        return (
            <div className="messages">
                <ChatList />
                <div className="message-view">
                    {chat ? this.renderHeader() : null}
                    <div className="flex-row flex-grow-1">
                        <div className="flex-col flex-grow-1" style={{ position: 'relative' }}>
                            {chatStore.chats.length === 0 && !chatStore.loading ? <NoChatSelected /> : <MessageList />}
                            {chat && chat.uploadQueue.length ? <UploadInChatProgress queue={chat.uploadQueue} /> : null}
                            <MessageInput show={!!chat && chat.metaLoaded}
                                placeholder={
                                    chatStore.activeChat ?
                                        t('title_messageInputPlaceholder', { chatName: chatStore.activeChat.name })
                                        : null
                                }
                                onSend={this.sendMessage} onAck={this.sendAck} onFileShare={this.shareFiles} />
                        </div>
                        {chat ? <ChatSideBar open={Chat.sidebarOpen} /> : null}
                    </div>
                </div>
            </div>
        );
    }
}


module.exports = Chat;
