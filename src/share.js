import './share.less';
import {defer, domReady} from './lib/promise';
import {find, findAll, on, show as visible} from './lib/dom';

var $share;
export async function show() {
    await domReady();

    $share = document::find('#share');
    $share::visible()
        ::find('.weibo')
        ::on('click', function(e) {
            alert('share weibo');
        });
}