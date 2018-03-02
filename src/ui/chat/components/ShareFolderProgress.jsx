const React = require('react');
const { observer } = require('mobx-react');

const T = require('~/ui/shared-components/T');
const css = require('classnames');

const { fileStore } = require('peerio-icebear');
const { MaterialIcon, ProgressBar } = require('~/peer-ui');

@observer
class ShareFolderProgress extends React.Component {
    render() {
        const folder = fileStore.folders.root.folders[0] || {
            name: 'Folder name A',
            progress: 100,
            progressMax: 100
        };

        const { progress, progressMax, progressPercentage } = folder;

        return (
            <div className="share-folder-progress">
                <div className="info">
                    <MaterialIcon icon="folder" />
                    <div className="text">
                        <T k="title_sharing" tag="span" />&nbsp;
                        <span>{folder.name}</span>&nbsp;
                        {/*
                            <span className="items-left">({t('title_itemsLeft', { number: 4 })})</span>
                        */}
                    </div>
                    <div className="percent-progress">
                        <span>{`${progressPercentage}%`}</span>
                        <MaterialIcon icon="check"
                            className={css(
                                'affirmative',
                                { hide: progress < progressMax }
                            )}
                        />
                    </div>
                </div>
                <ProgressBar value={progress} max={progressMax} />
            </div>
        );
    }
}

module.exports = ShareFolderProgress;
