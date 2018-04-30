const React = require('react');
const { observable, action } = require('mobx');
const { observer } = require('mobx-react');
const css = require('classnames');
const FolderActions = require('./FolderActions');
const { Checkbox, CustomIcon, MaterialIcon, ProgressBar } = require('~/peer-ui');
const { t } = require('peerio-translator');

@observer
class FolderLine extends React.Component {
    @observable showActions = false;

    @action.bound onShowActions() {
        this.showActions = true;
    }

    @action.bound onHideActions() {
        this.showActions = false;
    }

    render() {
        const { folder } = this.props;
        const { progress, progressMax, progressPercentage } = folder;
        return (
            <div data-folderid={folder.folderId}
                className={css(
                    'row',
                    'custom-icon-hover-container',
                    this.props.className,
                    {
                        'selected-row': this.props.selected,
                        disabled: folder.isBlocked
                    }
                )}
                onMouseEnter={this.onShowActions}
                onMouseLeave={this.onHideActions}>

                {progressMax
                    ? <div className="file-checkbox folder-share-progress">
                        {`${progressPercentage}%`}
                        <ProgressBar value={progress} max={progressMax} />
                    </div>
                    : this.props.checkbox
                        ? <Checkbox
                            className={css('file-checkbox', { disabled: this.props.disabledCheckbox })}
                            checked={this.props.selected}
                            onChange={this.props.disabledCheckbox ? null : this.props.onToggleSelect}
                        />
                        : <div className="file-checkbox" />
                }

                <div className="file-icon"
                    onClick={this.props.onChangeFolder} >
                    {folder.isShared
                        ? <CustomIcon icon="folder-shared" hover selected={this.props.selected} />
                        : <MaterialIcon icon="folder" />
                    }
                </div>

                <div className="file-name clickable selectable"
                    onClick={this.props.onChangeFolder} >
                    {folder.name}
                </div>

                {this.props.folderDetails &&
                    <div className="file-owner">
                        {folder.owner ? folder.owner : t('title_you')}
                    </div>
                }

                {this.props.folderDetails && <div className="file-uploaded" /> }

                {this.props.folderDetails && <div className="file-size" /> }

                { /* TODO: use spread operator */
                    this.props.folderActions &&
                    <div className="file-actions">
                        <FolderActions
                            onClick={this.props.onClick}
                            onRename={this.props.onRenameFolder}
                            onDownload={this.props.onDownload}
                            onMove={folder.isShared ? null : this.props.onMoveFolder}
                            onDelete={this.props.onDeleteFolder}
                            deleteDisabled={folder.isBlocked}
                            onShare={this.props.onShare}
                            data-folderid={folder.folderId}
                            disabled={this.props.selected}
                        />
                    </div>
                }
            </div>
        );
    }
}

module.exports = FolderLine;
