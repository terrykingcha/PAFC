import './title.less';
import {defer, domReady, delay, waitForEvent} from './lib/promise';

import {manager, onProgress, onError} from './prologue';
import * as Clock from './clock';

export async function show() {
    await Clock.ready();

    var state = Clock.state();
    var images = titleImages[state === 'daylight' ? 'black' : 'white'];

    var $titleWrap = document::$find('#title .wrap')
        ::$append(images)

    await delay(1);

    $titleWrap::$addClass('anim');

    await delay(2000);
}

export async function hide() {
    var $title = document::$find('#title')::$addClass('fadeOut');
    await delay(450);
    $title::$remove();
}

var titleImages = {
    white: new Array(4),
    black: new Array(4)
};

for (let i = 1; i <= 4; i++) {
    for (let k in titleImages) {
        new THREE.ImageLoader(manager).load(
            `assets/images/title_${k}_${i}.png`,
            (image) => {titleImages[k][i - 1] = image},
            onProgress,
            onError
        ); 
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
    await domReady();

    document.body::$append(template());
})();