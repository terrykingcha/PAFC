import './nav.less';
import {defer, domReady} from './lib/promise';
import {find, findAll, on, show as visible} from './lib/dom';
import {show as showMenu} from './menu';

var $nav;
export async function show() {
    await domReady();

    $nav = document::find('#nav');
    $nav::visible()
        ::find('.open')
        ::on('click', function(e) {
            showMenu();
        });

    $nav::find('.music')
        ::on('click', function(e) {
            alert('toggle music');
        });
}