import {defer, domReady} from './lib/promise';
import {manager} from './prologue';

var url = './assets/fonts/weblysleek';
manager.itemStart(url);
window.fontloadcallback = function(base64) {
    var fontface = `
        @font-face {
            font-family: 'weblysleek';
            src: url(${base64}) format('truetype');
        }
    `;
    var style = document.createElement('style');
    style.innerHTML = fontface;
    document.querySelector('head').appendChild(style);
    manager.itemEnd(url);
}

var fontLoader = document.createElement('script');
fontLoader.src = url;
fontLoader.async = true;

(async () => {
    await domReady();
    document.body.appendChild(fontLoader);
})();