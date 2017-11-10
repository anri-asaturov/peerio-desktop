const React = require('react');
const { observable, computed } = require('mobx');
const { observer } = require('mobx-react');
const css = require('classnames');
const { FontIcon } = require('~/react-toolbox');
const _ = require('lodash');
const { t } = require('peerio-translator');
const { User } = require('~/icebear');

const {
    emojiCategories,
    emojiByCanonicalShortname,
    emojiData
} = require('~/helpers/chat/emoji');

const recentList = computed(() => {
    if (!User.current) return [];
    return User.current.emojiMRU.list.map(shortname => emojiByCanonicalShortname[shortname]);
});

const emojiDataWithRecent = { ...emojiData };
Object.defineProperty(emojiDataWithRecent, 'recent', {
    get: () => recentList.get()
});

const categories = [{ id: 'recent', name: 'Recently Used' }, ...emojiCategories];


// separate store is needed to avoid re-render of all emojis on hover
class PickerStore {
    @observable hovered = null;
}

const store = new PickerStore();

function skipNulls(i) {
    if (i === null) return false;
    return true;
}

/**
 * @augments {React.Component<{
        onPicked : (emoji : any) => void
        onBlur : () => void
    }, {}>}
 */
@observer
class Picker extends React.Component {
    @observable selectedCategory = categories[0].id;
    @observable searchKeyword = '';

    dontHide = false;

    onCategoryClick = id => {
        const el = document.getElementsByClassName(`category-header ${id}`)[0];
        if (!el) return;
        this.selectedCategory = id;
        el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    };

    resetHovered = () => {
        this.dontHide = false;
        setTimeout(() => {
            if (!this.dontHide) store.hovered = null;
        }, 2000);
    };

    onSearchKeywordChange = (val) => {
        this.searchKeyword = val;
    };

    handleScroll = _.throttle(() => {
        const candidates = [];
        let closest;
        const parent = document.getElementsByClassName(`emojis`)[0];
        for (let i = 0; i < categories.length; i++) {
            const c = document.getElementsByClassName(`category-header ${categories[i].id}`)[0];
            if (!c || c.offsetTop > (parent.offsetHeight + parent.scrollTop)) continue;
            candidates.push({ id: categories[i].id, offsetTop: c.offsetTop });
        }
        if (!candidates.length) return;
        closest = candidates[0];
        for (let i = 1; i < candidates.length; i++) {
            if (Math.abs(parent.scrollTop - closest.offsetTop) > Math.abs(parent.scrollTop - candidates[i].offsetTop)) {
                closest = candidates[i];
            }
        }
        if (this.selectedCategory !== closest.id) this.selectedCategory = closest.id;
    }, 1000);

    onEmojiMouseEnter = (e) => {
        this.dontHide = true;
        store.hovered = e.target.attributes['data-shortname'].value;
    };
    onPicked = (e) => {
        const shortname = e.target.attributes['data-shortname'].value;
        User.current.emojiMRU.addItem(shortname);
        this.props.onPicked(emojiByCanonicalShortname[shortname]);
    };
    preventBlur = () => {
        this.noBlur = true;
    };
    handleBlur = (ev) => {
        if (this.noBlur) {
            this.noBlur = false;
            ev.target.focus();
            return;
        }
        this.props.onBlur();
    };
    render() {
        const searchLow = this.searchKeyword.toLocaleLowerCase();
        return (
            <div className="emoji-picker" onBlur={this.handleBlur} onMouseDown={this.preventBlur}>
                <div className="categories" key="categories">
                    {
                        categories.map(c =>
                            (<Category id={c.id} key={c.id} selected={this.selectedCategory === c.id}
                                name={c.name} onClick={this.onCategoryClick} />))
                    }
                </div>
                <SearchEmoji searchKeyword={this.searchKeyword} onSearchKeywordChange={this.onSearchKeywordChange}
                    clearSearchKeyword={this.clearSearchKeyword} />
                <div className="emojis" key="emojis" onScroll={this.handleScroll}>
                    {
                        categories.map(c => {
                            return (<div key={c.id}>
                                <div className={`category-header ${c.id}`}>{c.name}</div>
                                {emojiDataWithRecent[c.id].map(e => {
                                    if (!e || e.index.indexOf(searchLow) < 0) return null;
                                    return (
                                        <span onMouseEnter={this.onEmojiMouseEnter}
                                            onMouseLeave={this.resetHovered} onClick={this.onPicked}
                                            className={e.className}
                                            key={e.unicode} data-shortname={e.shortname} />);
                                }).filter(skipNulls)}
                            </div>);
                        }).filter(item => item.props.children[1].length > 0)
                    }
                </div>
                <InfoPane />
            </div>
        );
    }
}

@observer
class SearchEmoji extends React.Component {
    @observable keyword = '';
    inputRef(ref) {
        if (ref) ref.focus();
    }
    onKeywordChange = (ev) => {
        this.keyword = ev.target.value;
        this.fireChangeEvent();
    };
    fireChangeEvent = _.throttle(() => {
        this.props.onSearchKeywordChange(this.keyword);
    }, 250);
    clearSearchKeyword = () => {
        this.keyword = '';
        this.fireChangeEvent();
    };
    render() {
        // Don't make IconButton out of clear search keyword button, it messes up blur event
        return (<div className="emoji-search">
            <FontIcon value="search" className="search-icon" />
            <input className="emoji-search-input" type="text" placeholder={t('title_search')}
                ref={this.inputRef}
                onChange={this.onKeywordChange} value={this.keyword} />
            {
                this.props.searchKeyword
                    ? <FontIcon className="clear-keyword-button"
                        value="highlight_off" onClick={this.clearSearchKeyword} />
                    : null
            }
        </div>);
    }
}

@observer
class InfoPane extends React.Component {
    render() {
        if (!store.hovered) {
            return (
                <div className="info-pane default">
                    <span className="emojione emojione-32-people _1f446" /> Pick your emoji
                </div>
            );
        }
        const item = emojiByCanonicalShortname[store.hovered];
        return (
            <div className="info-pane">
                <span className={item.className} />
                <div>
                    <span className="bold">{item.name}</span><br />
                    {item.shortname} {item.aliases}<br />
                    <span className="monospace">{item.ascii}</span>
                </div>
            </div>
        );
    }
}

function Category(props) {
    return (
        <img src={`static/img/emoji-categories/${props.id}.svg`}
            title={props.name} alt={props.name}
            className={css('category', { selected: props.selected })}
            onClick={() => props.onClick(props.id)} />
    );
}

module.exports = Picker;
