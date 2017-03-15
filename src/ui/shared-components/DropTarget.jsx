const React = require('react');
const dragStore = require('~/stores/drag-drop-store');
const { observable } = require('mobx');
const { observer } = require('mobx-react');
const { FontIcon, Dialog } = require('~/react-toolbox');
const { fileStore, chatStore } = require('~/icebear');
const { t } = require('peerio-translator');

@observer
class DropTarget extends React.Component {
    @observable dialogActive = false;
    _files;

    componentWillMount() {
        dragStore.onFilesDropped(this.upload);
    }

    cancelUpload = () => {
        this.dialogActive = false;
        this._files = [];
    };

    upload = (files) => {
        if (this.dialogActive) return;
        this._files = files;
        if (window.router.getCurrentLocation().pathname === '/app' && chatStore.activeChat) {
            this.dialogActive = true;
            return;
        }
        this.justUpload(files);
    };

    justUpload = () => {
        this._files.forEach(f => { fileStore.upload(f); });
        this.dialogActive = false;
    };

    uploadAndShare = () => {
        this._files.forEach(f => void chatStore.activeChat.uploadAndShareFile(f));
        this.dialogActive = false;
    };

    uploadActions = [
        { label: t('button_cancel'), onClick: this.cancelUpload },
        { label: t('button_upload'), onClick: this.uploadAndShare }

    ];

    render() {
        if (this.dialogActive) {
            return (
                <Dialog
                  actions={this.uploadActions}
                  active
                  onEscKeyDown={this.cancelUpload}
                  onOverlayClick={this.cancelUpload}
                  title={t('title_uploadAndShare')}>
                    <p>{t('title_fileWillBeShared')}</p>
                </Dialog>
            );
        }

        if (!dragStore.hovering) return null;
        return (
            <div className="global-drop-target">
                <div className="drop-content">
                    <FontIcon value="cloud_upload" />
                    <div className="display-2">
                        {t('title_dropToUpload', { count: dragStore.hoveringFileCount })}
                    </div>
                </div>
            </div>
        );
    }
}

module.exports = DropTarget;
