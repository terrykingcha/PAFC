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
    document.body::$find(`#nav .${className}`)::$show();
}

export function disable(className) {
    document.body::$find(`#nav .${className}`)::$hide();
}

var $nav;
export function on() {
    $nav::$on(...arguments);
}

export function off() {
    $nav::$off(...arguments);
}

var originColor;
export function changeColor(color) {
    color = color || originColor;
    $nav::$removeClass('black white')
        ::$addClass(color);
}

export async function show() {
    await Clock.ready();

    var state = Clock.state();
    originColor = state === 'daylight' ? 'black' : 'white'
    changeColor(originColor);

    var changed;
    $nav::$show()
        ::$on('click', 'a', function() {
            $nav::$trigger('change', [this::$attr('class'), changed]);
            changed = this::$attr('class');
            if (changed === 'music') {
                this::$attr('off') === 'off' ? 
                    this::$removeAttr('off') :
                    this::$attr('off', 'off');
            }
        });
}

function template() {
    return `
        <div id="nav">
            <a class="music"></a>
            <a class="category" anim><span>Concert</span></a>
            <a class="video" anim><span>Video</span></a>
            <a class="index" anim><span>Index</span></a>
        </div>
    `;
}

(async () => {
    await domReady();
    $nav = document.body::$append(template())::$find('#nav');
})(); 