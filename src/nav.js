import './nav.less';
import {defer, domReady} from './lib/promise';

var deferred = defer();
export var ready = () => deferred.promise;

var musicToggleHandlers = [];
export function onmusic(handler) {
    if (musicToggleHandlers.indexOf(handler) < 0) {
        musicToggleHandlers.push(handler);
    }
}

export function enable(className) {
    document.body::$find(`#nav .${className}`)::$show();
}

export function enableAll(className) {
    document.body::$find('#nav a')::$show();
}

export function disable(className) {
    document.body::$find(`#nav .${className}`)::$hide();
}

export function disableAll(className) {
    document.body::$find('#nav a')::$hide();
}

var $nav;
export function on() {
    $nav::$on(...arguments);
}

export function off() {
    $nav::$off(...arguments);
}

export async function show() {
    var changed;
    $nav::$show()
        ::$on('click', 'a', function() {
            var className = this::$attr('class');
            className = className.replace(/\b(on|off|iconfont|\s)\b/ig, '');
            $nav::$trigger('change', [className, changed]);
            changed = className;
            if (changed === 'music') {
                this::$toggleClass('on off');
            }
        });
}

function template() {
    return `
        <div id="nav">
            <a class="music on iconfont"></a>
            <a class="clock iconfont" anim><span>CLOCK</span></a>
            <a class="info iconfont" anim><span>INFO</span></a>
            <a class="index iconfont" anim><span>INDEX</span></a>
        </div>
    `;
}

(async () => {
    await Promise.all([
        domReady()
    ]);

    $nav = document.body::$append(template())::$find('#nav');
    deferred.resolve();

})(); 