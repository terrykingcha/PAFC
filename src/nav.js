import './nav.less';
import {defer, domReady} from './lib/promise';
import {show as showMenu} from './menu';
import * as Clock from './clock';

var musicToggleHandlers = [];
export function onmusic(handler) {
    if (musicToggleHandlers.indexOf(handler) < 0) {
        musicToggleHandlers.push(handler);
    }
}

export function enable(className) {
    document::$find(`#nav .${className}`)::show();
}

export function disable(className) {
    document::$find(`#nav .${className}`)::hide();
}

export async function show() {
    await Clock.ready();

    var state = Clock.state();

    var $nav = document::$find('#nav');

    $nav::$addClass(state === 'daylight' ? 'black' : 'white')::$show();
    //     ::find('.open')
    //     ::on('click', function(e) {
    //         showMenu();
    //     });

    // var $music = $nav::find('.music');

    // $music::on('click', function(e) {
    //     $music::toggleClass('off');
    //     var on = !$music::hasClass('off');
    //     musicToggleHandlers.forEach((h) => h(on));
    // });
}

function template() {
    return `
        <div id="nav">
            <a class="index"></a>
            <a class="video"></a>
            <a class="category"></a>
            <a class="music"></a>
        </div>
    `;
}

(async () => {
    await domReady();
    document.body::$append(template());
})(); 