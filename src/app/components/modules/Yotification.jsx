import {connect} from 'react-redux';
import tt from 'counterpart'
import { Set } from 'immutable';
import Icon from 'app/components/elements/Icon';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import Notification from 'app/components/elements/notification';
import * as nType from 'app/components/elements/notification/type';
import { Link } from 'react-router'
import debounce from 'lodash.debounce';
import React from 'react';
import Url from 'app/utils/Url';

export const LAYOUT_PAGE = 'Page';
export const LAYOUT_DROPDOWN = 'Dropdown';
export const FILTER_ALL = 'all';

const TIMEOUT_MARK_SHOWN_MILLIS = 3000;

const filters = {
    security: [nType.SECURITY_PWD_CHANGE, nType.SECURITY_WITHDRAWAL, nType.SECURITY_NEW_MOBILE, nType.SECURITY_POWER_DOWN],
    transfers: [nType.RECEIVE_STEEM, nType.POWER_DOWN],
    comments: [nType.POST_REPLY],
    replies: [nType.COMMENT_REPLY],
    resteems: [nType.RESTEEM],
    following: [nType.FOLLOW_AUTHOR_POST]
}

function topPosition(domElt) {
    if (!domElt) {
        return 0;
    }
    return domElt.offsetTop + topPosition(domElt.offsetParent);
}

const renderNotificationList = (notifications = []) => {
    const notificationList = [];
    notifications.forEach( notification => {
        if(!notification.hide) {
            const classNames = "item" + ( notification.read ? '' : ' unread' );
            notificationList.push( <li className={classNames} key={notification.id}><Notification {...notification} /></li> );
        }
    })
    return ( <ul className="Notifications">{notificationList}</ul> );
}

const renderFilterList = (props) => {
    const locales = tt;
    let className = ('all' === props.filter)? 'selected' : ''; //eslint-disable-line yoda
    const filterLIs = Object.keys(filters).reduce((list, filter) => {
        className = (filter === props.filter)? 'selected' : '';
        list.push(<li key={filter} className={className}><Link
            to={Url.notifications(filter)}>{locales(`notifications.filters.${filter}`)}</Link></li>);
        return list;
    }, [<li key="legend" className="selected">{tt("notifications.filters._label")}</li>, <li key="all" className={className}><Link to={Url.notifications()}>{tt('notifications.filters.all')}</Link></li>]);
    return ( <ul className="menu">{filterLIs}</ul>);
}

//todo: make functional


class YotificationModule extends React.Component {
    constructor(props) {
        super(props);
        this.htmlId = 'YotifModule_' + Math.floor(Math.random() * 1000);
        switch (props.layout) { //eslint-disable-line
            case LAYOUT_DROPDOWN :
                this.state = {
                    layout: props.layout,
                    showFilters: false,
                    showFooter: true
                };
                break;
            case LAYOUT_PAGE :
                this.state = {
                    layout: props.layout,
                    showFilters: true,
                    showFooter: false
                };
                break;
        }
        this.scrollListener = this.scrollListener.bind(this);

    }

    componentDidMount() {
        window.addEventListener('scroll', this.scrollListener, {capture: false, passive: true});
        window.addEventListener('resize', this.scrollListener, {capture: false, passive: true});
        if(LAYOUT_PAGE === this.state.layout) {
            this.scrollListener();
        }
        this.markDisplayedShownWithDelay();
    }

    shouldComponentUpdate(nextProps, nextState) { //eslint-disable-line
        if(this.props.filter != nextProps.filter) {
            this.markDisplayedShownWithDelay();
        }
        return true;
    }

    componentWillUnmount() {
        clearTimeout(this.markDisplayedShownTimeout);
    }


    markDisplayedRead = () => { //eslint-disable-line no-undef
        this.props.updateSome(this.props.notifications, {read: true} );
    }

    markDisplayedHidden = () => { //eslint-disable-line no-undef
        this.props.updateSome(this.props.notifications, {hide: true} );
    }

    markDisplayedShownWithDelay = () => { //eslint-disable-line no-undef
        const self = this;
        clearTimeout(this.markDisplayedShownTimeout);
        this.markDisplayedShownTimeout = setTimeout(() => {
            self.props.updateSome(this.props.notifications, {shown: true} );
        }, TIMEOUT_MARK_SHOWN_MILLIS)
    }

    loadTestData = () => { //eslint-disable-line no-undef // Todo: for dev only! Do not merge if present!
        this.props.getSomeGetSomeGetSomeYeahYeah();
    }

    loadMoreTestData = () => { //eslint-disable-line no-undef // Todo: for dev only! Do not merge if present!
        this.props.comeOnItsSuchAJoy();
    }

    appendSome = () => { //eslint-disable-line no-undef
        this.props.appendSome(('all' !== this.props.filter)? filters[this.props.filter] : false); //eslint-disable-line yoda
    }

    scrollListener = debounce(() => { //eslint-disable-line no-undef
        const el = window.document.getElementById(this.htmlId);
        if (!el) return;
        const scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset :
            (document.documentElement || document.body.parentNode || document.body).scrollTop;
        if (topPosition(el) + el.offsetHeight - scrollTop - window.innerHeight < 10) { //eslint-disable-line no-mixed-operators apparently math is scary!?
            console.log('scrollListenerFiring', this.htmlId, el); //Todo: for dev only! Do not merge if present - probably belongs in a different place
            this.props.appendSome(('all' !== this.props.filter)? filters[this.props.filter] : false); //eslint-disable-line yoda
            //todo: render a spinner here. Check PostsList.jsx for starting point
        }
    }, 150)

    render() {
        return ( <div id={this.htmlId} className={"NotificationsModule " + this.state.layout} >
            <div className="title">{tt('g.notifications')}
                <span className="controls-right">
                    {(this.props.showClearAll) ?
                        <button className="ptc" onClick={this.markDisplayedHidden}>{tt('notifications.controls.mark_all_hidden')}</button> :
                        <button className="ptc" onClick={this.markDisplayedRead}>{tt('notifications.controls.mark_all_read')}</button>
                    }
                    <button className="ptc" onClick={this.loadTestData}>Populate</button> {/* Todo: for dev only! Do not merge if present!*/}
                    <button className="ptc" onClick={this.loadMoreTestData}>... more</button> {/* Todo: for dev only! Do not merge if present!*/}
                    <Link to={Url.profileSettings()}><Icon name="cog" /></Link>
                </span>
            </div>
            {(this.state.showFilters)? renderFilterList(this.props) : null}
            {renderNotificationList(this.props.notifications)}
            <div className="footer get-more">
                {(true === this.props.fetchMore)? <LoadingIndicator type="circle" inline /> : <button className="ptc" onClick={this.appendSome}>{ this.props.fetchMore }</button>}</div>
            {(this.state.showFooter)? <div className="footer">{tt('notifications.controls.go_to_page')}</div> : null }
            {(this.state.showFooter)? (<div className="footer absolute">
                <Link to={Url.profile() + '/notifications'} className="view-all">{tt('notifications.controls.go_to_page')}</Link>
            </div>) : null}
        </div>);
    }
}

YotificationModule.propTypes = {
    comeOnItsSuchAJoy: React.PropTypes.func.isRequired, // Todo: for dev only! Do not merge if present!
    getSomeGetSomeGetSomeYeahYeah: React.PropTypes.func.isRequired, // Todo: for dev only! Do not merge if present!
    updateSome: React.PropTypes.func.isRequired,
    appendSome: React.PropTypes.func.isRequired,
    //notifications: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    layout: React.PropTypes.oneOf([LAYOUT_PAGE, LAYOUT_DROPDOWN]),
    showClearAll: React.PropTypes.bool.isRequired
};

YotificationModule.defaultProps = {
    layout: LAYOUT_PAGE
};

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const filter = (ownProps.filter && filters[ownProps.filter]) ? ownProps.filter : FILTER_ALL;
        let allRead = true;
        let notifications = state.notification.byId;
        const fetchMore = (state.notification.isFetchingBefore)? true : tt('notifications.controls.fetch_more')

        if (notifications && filter !== FILTER_ALL) {
            const filteredTypes = filters[filter];
            const filteredIds = filteredTypes.reduce((ids, tok) => state.notification.byType[tok] ? ids.union(state.notification.byType[tok]) : ids, Set());
            notifications = notifications.filter((v, id) => filteredIds.includes(id));
        }

        notifications.forEach((n) => {
            if (false === n.read) { //eslint-disable-line yoda
                allRead = false;
                return false;
            }
            return true;
        });


        return {
            notifications,
            ...ownProps,
            filter,
            fetchMore,
            showClearAll: allRead
        }
    },
    dispatch => ({
        getSomeGetSomeGetSomeYeahYeah: () => { // Todo: for dev only! Do not merge if present!
            dispatch({
                type: 'notification/RECEIVE_ALL',
                payload: [
                    {"id":"UID","read":true,"shown":true,"notificationType":"powerDown","created":"2010-09-19T16:19:48","author":"roadscape","amount":10000.2}, //eslint-disable-line
                    {"id":"UID1","read":false,"shown":false,"notificationType":"resteem","created":"2010-08-19T18:59:00","author":"roadscape","item":{"author":"wolfcat","category":"introduceyourself","depth":0,"permlink":"from-the-hills-of-ireland-to-planet-steem-a-wolfy-hello","summary":"From the Hills of Ireland to Planet Steem, A Wolfy Hello!"}}, //eslint-disable-line
                    {"id":"UID2","read":false,"shown":true,"notificationType":"vote","notificationTime":3,"author":"beanz","created":"2017-09-19T18:59:00","item":{"author":"wolfcat","category":"introduceyourself","depth":0,"permlink":"from-the-hills-of-ireland-to-planet-steem-a-wolfy-hello","summary":"From the Hills of Ireland to Planet Steem, A Wolfy Hello!"}}, //eslint-disable-line
                    {"id":"UID3","read":true,"shown":true,"notificationType":"receiveSteem","created":"2017-09-19T16:19:48","author":"roadscape","amount":10000.2}, //eslint-disable-line
                    {"id":"UID4","read":true,"shown":true,"notificationType":"tag","created":"2020-09-19T07:48:03","author":"lovejoy","item":{"author":"lovejoy","category":"introduceyourself","depth":2,"permlink":"re-steemcleaners-re-steemcleaners-re-wolfcat-from-the-hills-of-ireland-to-planet-steem-a-wolfy-hello-20170919t120245144z","summary":"@wolfcat is a new user who normally doesn't spend a lot of time online, plus we are "},"rootItem":{"author":"wolfcat","category":"introduceyourself","permlink":"from-the-hills-of-ireland-to-planet-steem-a-wolfy-hello","summary":"From the Hills of Ireland to Planet Steem, A Wolfy Hello!"}}, //eslint-disable-line
                    {"id":"UID5","read":false,"shown":false,"notificationType":"vote","created":"2020-11-19T11:59:39","author":"roadscape","item":{"author":"wolfcat","category":"introduceyourself","depth":0,"permlink":"from-the-hills-of-ireland-to-planet-steem-a-wolfy-hello","summary":"From the Hills of Ireland to Planet Steem, A Wolfy Hello!"}}, //eslint-disable-line
                    {"id":"UID6","read":true,"shown":true,"notificationType":"postReply","created":"2017-09-19T14:24:51","author":"lovejoy","item":{"author":"lovejoy","category":"introduceyourself","depth":2,"permlink":"re-steemcleaners-re-steemcleaners-re-wolfcat-from-the-hills-of-ireland-to-planet-steem-a-wolfy-hello-20170919t120245144z","summary":"@wolfcat is a new user who normally doesn't spend a lot of time online, plus we are ","parentSummary":"You may want to retract your votes.The account has ignored our many requests to confirm the identity. It seems to be another case of fake identity. Thanks."},"rootItem":{"author":"wolfcat","category":"introduceyourself","permlink":"from-the-hills-of-ireland-to-planet-steem-a-wolfy-hello","summary":"From the Hills of Ireland to Planet Steem, A Wolfy Hello!"}}, //eslint-disable-line
                    {"id":"UID6.1","read":true,"shown":true,"notificationType":"securityNewMobileDevice","created":"2017-09-19T14:24:51","author":"security"}, //eslint-disable-line
                    {"id":"UID7","read":false,"shown":true,"notificationType":"commentReply","created":"2017-09-18T17:21:18","author":"dbzfan4awhile","item":{"author":"dbzfan4awhile","category":"introduceyourself","depth":3,"permlink":"re-wolfcat-re-dbzfan4awhile-re-wolfcat-from-the-hills-of-ireland-to-planet-steem-a-wolfy-hello-20170918t172118886z","summary":"Awesome!","parentSummary":"Yes! Ill look for you there :)"},"rootItem":{"author":"wolfcat","category":"introduceyourself","permlink":"from-the-hills-of-ireland-to-planet-steem-a-wolfy-hello","summary":"From the Hills of Ireland to Planet Steem, A Wolfy Hello!"}} //eslint-disable-line
                ],
            });
        },
        comeOnItsSuchAJoy: () => { // Todo: for dev only! Do not merge if present!
            dispatch({
                type: 'notification/APPEND_SOME',
                payload: [
                    {"id":"UID6.1","read":false,"shown":false,"notificationType":"securityNewMobileDevice","created":"2017-09-19T14:24:51","author":"security"}, //eslint-disable-line
                    {"id":"UID8","read":false,"shown":false,"notificationType":"powerDown","created":"2021-09-19T16:19:48","author":"roadscape","amount":138}, //eslint-disable-line
                    {"id":"UID9","read":true,"shown":true,"notificationType":"powerDown","created":"2021-09-20T16:19:48","author":"roadscape","amount":138}, //eslint-disable-line
                    {"id":"UID10","read":false,"shown":true,"notificationType":"powerDown","created":"2021-09-21T16:19:48","author":"roadscape","amount":138}, //eslint-disable-line
                ],
            });
        },
        updateSome: (notifications, changes) => {
            const ids = [];
            notifications.forEach((n) => {
                ids.push(n.id);
            });
            const action = {
                type: 'notification/UPDATE_SOME',
                ids,
                updates: changes
            };
            dispatch(action);
        },
        appendSome: (notificationTypes) => {
            const action = {
                type: 'notification/FETCH_SOME',
                types: notificationTypes,
                direction: 'after'
            };
            console.log('broadcasting notification/FETCH_SOME', action); //Todo: for dev only! Do not merge if present - probably belongs in a different place
            dispatch(action);
        }
    })
)(YotificationModule)
