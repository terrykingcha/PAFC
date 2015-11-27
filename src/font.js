import {defer, domReady} from './lib/promise';
import {manager} from './prologue';

function load(url, name, callback) {
    manager.itemStart(url);
    window[callback] = function(base64) {
        var fontface = `
            @font-face {
                font-family: '${name}';
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
    return fontLoader;
}

const FONT_NAME = 'camelia';
const FONT_URL = `./assets/fonts/${FONT_NAME}`;
var camelialoader = load(FONT_URL, FONT_NAME, `${FONT_NAME}callback`);

const ICONFONT_NAME = 'iconfont';
const ICONFONT_URL = `./assets/fonts/${ICONFONT_NAME}`;
var iconfontloader = load(ICONFONT_URL, ICONFONT_NAME, `${ICONFONT_NAME}callback`);

(async () => {
    await domReady();
    document.body.appendChild(camelialoader);
    document.body.appendChild(iconfontloader);
})();