import './nav.less';
import {defer, domReady} from './lib/promise';
import {find, findAll, on, show as visible, hasClass, toggleClass} from './lib/dom';
import {show as showMenu} from './menu';

var musicToggleHandlers = [];
export function onmusic(handler) {
    if (musicToggleHandlers.indexOf(handler) < 0) {
        musicToggleHandlers.push(handler);
    }
}

var $nav;
export async function show() {
    await domReady();

    $nav = document::find('#nav');
    $nav::visible()
        ::find('.open')
        ::on('click', function(e) {
            showMenu();
        });

    var $music = $nav::find('.music');

    $music::on('click', function(e) {
        $music::toggleClass('off');
        var on = !$music::hasClass('off');
        musicToggleHandlers.forEach((h) => h(on));
    });
}