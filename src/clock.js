import './clock.less';
import {defer, domReady} from './lib/promise';
import {manager, onProgress, onError} from './prologue';
import * as Category from './category';

var testState;
if ((testState = location.search.match(/time=([^=&]+)/))) {
    testState = testState[1];
}

export var serverTime;
export var clientTime;
var timeDeferred = defer();
export var timeReady = () => timeDeferred.promise;

manager.itemStart('server/clock');
serverTime = Date.now();
clientTime = Date.now();
manager.itemEnd('server/clock');
timeDeferred.resolve();


var deferred = defer();
export var ready = () => deferred.promise;

export function state() {
    var h = getHours();

    if (testState) {
        return testState;
    }
    
    if (h >= 6 && h < 18) {
        return 'daylight';
    } else {
        return 'night';
    }
}

export function section() {
    var h = getHours();
    var index = h % (24 / Category.length);
    return index; 
}

export function now() {
    var offset = Date.now() - clientTime;
    return serverTime + offset;
}

export function getHours() {
    var d = new Date();
    d.setTime(now());
    return d.getHours();
}

export function getMinutes() {
    var d = new Date();
    d.setTime(now());
    return d.getMinutes();
}

export function f12(h,m) {
    var f = {};
    h = h || getHours();
    m = m || getMinutes()
    f.hours = h > 12 ? h - 12 : h;
    f.minutes = m < 10 ? '0' + m : '' + m;
    f.ampm = h > 12 ? 'pm' : 'am';
    return f;
}

export function f24(h,m) {
    var f = {};
    h = h || getHours();
    m = m || getMinutes()
    f.hours = h < 10 ? '0' + h : '' + h;
    f.minutes = m < 10 ? '0' + m : '' + m;
    return f;
}

var $clock;
export async function show() {
    $clock::$removeClass('fadeOut')
        ::$addClass('fadeIn');
}

export async function hide() {
    $clock::$removeClass('fadeIn')
        ::$addClass('fadeOut');
}

export function run() {
    setTimeout(run, 60 * 1000);

    var {hours, minutes, ampm} = f12();
    var $clock = document::$find('#clock');

    $clock::$find('.category')::$text(Category.get(section()));
    $clock::$find('.ampm')::$text(ampm);
    $clock::$find('.time')::$text(`${hours}:${minutes}`);
}

function template() {
    return `
        <div id="clock">
            <span class="category"></span>
            <span class="ampm"></span>
            <span class="time"></span>
        </div>
    `;
}

(async () => {
    await Promise.all([
        domReady(),
        timeReady()
    ]);

    $clock = document.body::$append(template())
        ::$find('#clock')
        ::$addClass(state() === 'daylight' ? 'black' : 'white')

    deferred.resolve();
})();

