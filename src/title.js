import './title.less';
import {defer, domReady, delay, waitForEvent} from './lib/promise';
import {manager, onProgress, onError} from './prologue';
import * as Clock from './clock';

var deferred = defer();
export var ready = () => deferred.promise;

var $title;
export async function show() {
    await delay(1);

    $title::$show()::$find('.wrap')
        ::$addClass('anim');
    await delay(2000);
}

export async function hide() {
    $title::$addClass('fadeOut');
    await delay(450);
    $title::$remove();
}

var titleImages = {
    white: new Array(4),
    black: new Array(4)
};

for (let i = 0; i < 4; i++) {
    for (let k in titleImages) {
        titleImages[k][i] = new Promise(function(resolve, reject) {
            new THREE.ImageLoader(manager).load(
                `assets/images/title_${k}_${i+1}.png`,
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
    var images = await Promise.all(titleImages[state === 'daylight' ? 'black' : 'white']);

    $title::$find('.wrap')::$append(images);
    deferred.resolve();
})();