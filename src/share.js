import './share.less';
import {defer, domReady} from './lib/promise';
import {find, findAll, on, show as visible} from './lib/dom';

var shareHandlers = [];
export function onshare(handler) {
    if (shareHandlers.indexOf(handler) < 0) {
        shareHandlers.push(handler);
    }
}

var $share;
export async function show() {
    await domReady();

    $share = document::find('#share');
    $share::visible()
        ::find('.weibo')
        ::on('click', function(e) {
            shareHandlers.forEach((h) => h('weibo'));
        });
}