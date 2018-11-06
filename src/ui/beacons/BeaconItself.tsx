import React from 'react';
import ReactDOM from 'react-dom';
import { action, computed, observable, reaction, when, IReactionDisposer } from 'mobx';
import { observer } from 'mobx-react';
import css from 'classnames';
import { t } from 'peerio-translator';

const appRoot = document.getElementById('root');
const BEACON_COLOR = '#5461cc';

interface RectanglePosition {
    top?: string | number;
    right?: string | number;
    bottom?: string | number;
    left?: string | number;
    marginTop?: string | number;
    marginRight?: string | number;
    marginBottom?: string | number;
    marginLeft?: string | number;
    paddingRight?: string | number;
    paddingLeft?: string | number;
    background?: string;
}

@observer
export default class BeaconItself extends React.Component<{}> {
    @observable rendered = true;

    // `contentRect` stores the bounding rect for the child content.
    // We give it default values to start, to prevent null references
    @observable
    contentRect = {
        top: 0,
        left: 0,
        height: 0,
        width: 0
    };

    @action.bound
    setContentRect() {
        if (this.contentRef) {
            this.contentRect = this.contentRef.getBoundingClientRect();
        }
    }

    @observable reactionsToDispose: IReactionDisposer[];
    @observable renderTimeout: NodeJS.Timer;
    componentWillMount() {
        // Update `contentRect` on window resize
        window.addEventListener('resize', this.setContentRect);

        // Set childContent ref
        this.setChildContent();

        this.reactionsToDispose = [
            reaction(
                () => this.active && !!this.contentRef,
                active => {
                    if (active) {
                        this.renderTimeout = setTimeout(() => {
                            this.rendered = true;
                        }, 1);
                    } else {
                        this.rendered = false;
                    }
                }
            ),
            when(
                () => !!this.contentRef,
                () => {
                    this.setContentRect();
                }
            )
        ];
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.setContentRect);
        this.reactionsToDispose.forEach(dispose => {
            dispose();
        });
        clearTimeout(this.renderTimeout);
        this.renderTimeout = null;
    }

    // The size of the SpotBeacon bubble can be defined in prop `size`.
    // If not defined, it is the greater of the child content's width and height.
    @computed
    get circleSize() {
        if (this.props.type === 'spot' && !!this.props.size) return this.props.size;
        const { height, width } = this.contentRect;
        return height > width ? height + 8 : width + 8;
    }

    // Beacon's overall positioning
    @computed
    get beaconStyle() {
        const contentTop = this.contentRect.top;
        const contentLeft = this.contentRect.left;
        const contentHeight = this.contentRect.height;
        const contentWidth = this.contentRect.width;

        let height: number = 0;
        let width: number = 0;
        let top: number = 0;
        let left: number = 0;
        let marginSize: number = 0;

        if (this.props.type === 'spot') {
            height = this.circleSize;
            width = this.circleSize;

            /*
                To center the SpotBeacon over the child content,
                first the entire beacon is oriented to the center of the child content,
                then it is negatively offset by 50% of the bubble's diameter.
            */
            top = contentTop + contentHeight / 2;
            left = contentLeft + contentWidth / 2;
            marginSize = -this.circleSize / 2;
        } else {
            height = contentHeight;
            width = contentWidth;
            top = contentTop;
            left = contentLeft;
        }

        // `offestX` and `offsetY` props can shift beacon position by arbitrary pixel value
        /* eslint-disable operator-assignment */
        if (this.props.offsetX) left = left + this.props.offsetX;
        if (this.props.offsetY) top = top + this.props.offsetY;
        /* eslint-enable operator-assignment */
        // In this instance operator-assignment looks more clunky and unintuitive

        return {
            height,
            width,
            top,
            left,
            marginTop: marginSize,
            marginLeft: marginSize
        };
    }

    // The bubble's vertical position is determined by the beacon's position in the window.
    // The window is divided into 5 horizontal "slices", each corresponding to a bubble position.
    @computed
    get slicePosition() {
        const sliceHeight = window.innerHeight / 5;
        return Math.floor(this.contentRect.top / sliceHeight) + 1;
    }

    // Position and 'slice' classes get repeated for the beacon itself, and the .rectangle and .circle divs
    // This is redundant, but helps keep the styles more organized
    @computed
    get positionClasses(): string {
        return this.props.type === 'spot'
            ? `${this.props.position || 'left'} slice-${this.slicePosition}`
            : this.props.arrowPosition || 'bottom';
    }

    /*
        Rectangle's positioning
        This is one of the trickier calculations, in part because it's completely different for Area and Spot Beacons
    */
    @observable rectangleRef: React.RefObject<HTMLDivElement> = React.createRef();

    @computed
    get rectangleDimensions() {
        let rectHeight: number = 0;
        let rectWidth: number = 0;

        if (this.rectangleRef && this.rectangleRef.current) {
            const rectangle = this.rectangleRef.current.getBoundingClientRect();
            rectHeight = rectangle.height;
            rectWidth = rectangle.width;
        }

        return { rectHeight, rectWidth };
    }

    @computed
    get rectanglePosition(): RectanglePosition | null {
        const ret = {} as RectanglePosition;
        const { rectHeight, rectWidth } = this.rectangleDimensions;

        /*
            For SpotBeacon, rectangle needs to be positioned very precisely based on own size and circle size.
            There's a lot of offsets based on half of the rectangle height, or half the circle diameter.
            There's also the "punchout" effect, created by placing a CSS punchout of the rectangle
            exactly in the same location as the circle.
        */
        if (this.props.type === 'spot') {
            const rectangleOffset = rectHeight / 2;
            const circleRadius = this.circleSize / 2;
            const punchoutX = this.props.position === 'right' ? '100%' : 0;
            let punchoutY;

            switch (this.slicePosition) {
                case 1:
                    ret.top = '0';
                    ret.marginTop = circleRadius;
                    punchoutY = '0px';
                    break;
                case 2:
                    ret.top = '0';
                    punchoutY = `${circleRadius}px`;
                    break;
                case 3:
                default:
                    ret.top = '50%';
                    ret.marginTop = -rectangleOffset;
                    punchoutY = '50%';
                    break;
                case 4:
                    ret.bottom = '0';
                    punchoutY = `${rectHeight - circleRadius}px`;
                    break;
                case 5:
                    ret.bottom = '0';
                    ret.marginBottom = circleRadius;
                    punchoutY = '100%';
                    break;
            }

            if (this.props.position === 'right') {
                ret.paddingRight = circleRadius;
                ret.marginRight = -circleRadius;
            } else {
                ret.paddingLeft = circleRadius;
                ret.marginLeft = -circleRadius;
            }

            /*
                The highlight bubble itself is a transparent circle. However, since it sits on
                top of the rectangle, the corner of the rectangle will peek through the bubble.
                To solve this, we take advantage of a funny trick with `radial-gradient`, where
                we set a gradient from transparent to $peerio-purple, over a span of 1px. This
                has the effect of making a transparent circle with a radius of `circleRadius`.
            */
            ret.background = `radial-gradient(circle at ${punchoutX} ${punchoutY}, transparent ${circleRadius -
                1}px, ${BEACON_COLOR} ${circleRadius}px)`;
        } else {
            const arrowPos = this.props.arrowPosition || 'bottom';
            const arrowDistance = this.props.arrowDistance || 0;

            /*
                arrowDistance is an integer representing far along the edge the arrow is placed, as a percent of the edge's length.
                However, remember that the beacon's arrow is in fact the anchor, and the rectangle is oriented according to the arrow.
                This means that the rectangle's position is offset in the *negative* direction.
                (The `24` is a hardcoded pixel value for the arrow's width, so that the rectangle offset can't under/overshoot the arrow.)
            */
            const xOffset =
                arrowPos === 'top' || arrowPos === 'bottom'
                    ? `-${(arrowDistance * (rectWidth - 48)) / 100 + 24}px`
                    : 0;
            const yOffset =
                arrowPos === 'left' || arrowPos === 'right'
                    ? `-${(arrowDistance * (rectHeight - 48)) / 100 + 24}px`
                    : 0;

            switch (arrowPos) {
                case 'top':
                    ret.top = '100%';
                    ret.left = this.contentRect.width / 2;
                    ret.marginLeft = xOffset;
                    break;
                case 'right':
                    ret.top = this.contentRect.height / 2;
                    ret.right = '100%';
                    ret.marginTop = yOffset;
                    break;
                case 'bottom':
                default:
                    ret.bottom = '100%';
                    ret.left = this.contentRect.width / 2;
                    ret.marginLeft = xOffset;
                    break;
                case 'left':
                    ret.top = this.contentRect.height / 2;
                    ret.left = '100%';
                    ret.marginTop = yOffset;
                    break;
            }
        }

        return ret;
    }

    // `narrow` class added when rectangle height is less than two lines of text
    // (currently a hardcoded pixel value of 72)
    @computed
    get isNarrow() {
        if (!this.rectangleRef || !this.rectangleRef.current) return null;
        return this.rectangleRef.current.getBoundingClientRect().height < 72;
    }

    // Clicking the rectangle
    beaconClick = () => {
        this.beaconFadeout();
        if (this.props.onBeaconClick) this.props.onBeaconClick();
    };

    // Clicking the content of the bubble in a SpotBeacon
    contentClick = () => {
        this.beaconFadeout();
        if (this.props.type === 'spot' && !!this.props.onContentClick) this.props.onContentClick();
    };

    // Fading out current beacon is called on both beaconClick and contentClick
    @action.bound
    beaconFadeout() {
        this.rendered = false;
        beaconStore.increment();
    }

    beaconContent() {
        const title = this.props.title || t(`title_${this.props.name}_beacon`);
        const description = this.props.description || t(`description_${this.props.name}_beacon`);

        return (
            <div
                key={`beacon-content-${this.props.name}`}
                className={css(
                    'beacon',
                    this.props.className,
                    `${this.props.type}-beacon`,
                    this.positionClasses,
                    {
                        show: this.rendered
                    }
                )}
                style={this.beaconStyle}
            >
                <div
                    ref={this.rectangleRef}
                    className={css('rectangle', this.positionClasses, {
                        narrow: this.isNarrow
                    })}
                    style={this.rectanglePosition}
                    onClick={this.beaconClick}
                >
                    <div className="rectangle-content">
                        {title ? <div className="header">{title}</div> : null}
                        {description}
                    </div>
                </div>

                {this.props.type === 'spot' ? (
                    <Bubble
                        position={this.positionClasses}
                        size={this.circleSize}
                        onClick={this.contentClick}
                    />
                ) : (
                    <Arrow position={this.positionClasses} />
                )}
            </div>
        );
    }

    render() {
        if (!this.active && !this.rendered) return this.props.children;

        const beaconContent = this.beaconContent();
        return [this.childContent, ReactDOM.createPortal(beaconContent, appRoot)];
    }
}

interface ArrowProps {
    classNames?: string;
    position: string;
}

@observer
class Arrow extends React.Component<ArrowProps> {
    render() {
        return <div className={css('arrow', this.props.classNames, this.props.position)} />;
    }
}

interface BubbleProps {
    classNames?: string;
    position: string;
    size: number;
    onClick?: () => void;
}

@observer
class Bubble extends React.Component<BubbleProps> {
    render() {
        return (
            <div
                className={css('circle', this.props.classNames, this.props.position, {
                    clickable: !!this.props.onClick
                })}
                style={{
                    height: this.props.size,
                    width: this.props.size
                }}
                onClick={this.props.onClick}
            >
                <div className="circle-inner" />
            </div>
        );
    }
}