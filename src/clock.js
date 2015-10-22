import './clock.less';
import {defer, domReady} from './lib/promise';
import {find, findAll, text} from './lib/dom';

export var timestamp;
export var clientOffset;

var deferred = defer();
export var ready = () => deferred.promise;

timestamp = Date.now();
clientOffset = Date.now();
deferred.resolve();

export function state() {
    var h = getHours();
    
    if (h >= 5 && h < 8) {
        return 'dawn';
    } else if (h >= 8 && h < 16) {
        return 'daylight';
    } else if (h >= 16 && h < 19) {
        return 'sunset';
    } else {
        return 'night';
    }
}

export function now() {
    var offset = Date.now() - clientOffset;
    return timestamp + offset;
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
    await domReady();

    $clock = document::find('#clock');
    $clock.style.display = 'block';
}

export function run() {
    setTimeout(run, 60 * 1000);

    var {hours, minutes, ampm} = f12();

    $clock::find('.time')::text(`${hours}:${minutes}`);
    $clock::find('.ampm')::text(ampm);
}


