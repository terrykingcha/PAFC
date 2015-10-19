import {defer, domReady} from './promise';

export function width () {
    return window.innerWidth;
}

export function height () {
    return window.innerHeight;
}

var d = new Date();
export function time() {
    var h = d.getHours();

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

