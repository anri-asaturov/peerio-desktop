import React from 'react';
import { observer } from 'mobx-react';
import T from '~/ui/shared-components/T';

@observer
export default class ZeroChats extends React.Component {
    render() {
        return (
            <div className="zero-chats">
                <div className="text-container top">
                    <T k="title_zeroChats" className="title" tag="div" />
                    <T k="title_zeroChatsDescription" tag="div" />
                </div>
                <img src="./static/img/illustrations/zero-chats.svg" draggable={false} />

                <div className="text-container bottom">
                    <T k="title_createRooms" tag="div" />
                    <T k="title_createDMs" tag="div" />
                </div>
            </div>
        );
    }
}
