import './title.less';
import {defer, domReady, delay, waitForEvent} from './lib/promise';
import {manager, onProgress, onError} from './prologue';
import {requestAnimationFrame} from './lib/util';
import * as Clock from './clock';

var deferred = defer();
export var ready = () => deferred.promise;

var $title;
var images;
export async function show() {
    await delay(1);

    var $wrap = $title::$show()::$find('.wrap');
    $wrap::$height($wrap::$width() / 1920 * 1080);

    await new Promise(function(resolve, reject) {
        var i = 0;

        requestAnimationFrame(function tick() {
            if (i === 32) return resolve();
            requestAnimationFrame(tick);
            $wrap.innerHTML = '';
            $wrap.appendChild(images[i++]);
        });
    });

    await delay(2000);
}

export async function hide() {
    $title::$addClass('fadeOut');
    await delay(450);
    $title::$remove();
}

var imageLoaders = {
    white: new Array(33),
    black: new Array(33)
};

for (let i = 0; i < 33; i++) {
    for (let k in imageLoaders) {
        imageLoaders[k][i] = new Promise(function(resolve, reject) {
            new THREE.ImageLoader(manager).load(
                `assets/images/icon-${k}-mini/icon-${k}_00${i}.png`,
                image => resolve(image),
                onProgress,
                onError
            ); 
        });
    }
}

function template() {
    return `
        <div id="title">
            <div class="wrap"></div>
        </div>
    `;
}

(async () => {
    await Promise.all([
        domReady(),
        Clock.ready()
    ]);

    $title = document.body::$append(template())::$find('#title');

    var state = Clock.state();
    images = await Promise.all(imageLoaders[state === 'daylight' ? 'black' : 'white']);
    deferred.resolve();
})();