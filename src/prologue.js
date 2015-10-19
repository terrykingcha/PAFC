import './prologue.less';
import {defer, domReady, delay} from './lib/promise';
import {width, height} from './lib/env';
import {requestAnimationFrame} from './lib/util';

var deferred = defer();
export var ready = () => deferred.promise;

var loaded = 0;
var total = 0;
var percent = 0;

export var manager = new THREE.LoadingManager();
manager.onProgress = function (item, _loaded, _total) {
    loaded = _loaded;
    total = _total;
    percent += 1 / total;
    console.log(item, _loaded, _total)
    if (loaded === total) {
        deferred.resolve();
    }
};

var progressStep = 0.01;
export function onProgress(xhr) {
    if (loaded && total) {
        percent += progressStep * loaded / total;
    } else {
        percent += progressStep;
    }
};

export function onError(xhr) {
}

var titleSCImg = new THREE.ImageLoader(manager).load(
    'assets/images/title_c.png',
    (image) => {titleSCImg = image},
    onProgress,
    onError
);

var titleENImg = new THREE.ImageLoader(manager).load(
    'assets/images/title_e.png',
    (image) => {titleENImg = image},
    onProgress,
    onError
);

export var opening = async () => {
    var $loading = document.querySelector('#prologue .loading');
    $loading.className += ' anime';
    await delay(800);
    $loading.style.display = 'none';

    var $title = document.querySelector('#prologue .title');
    $title.style.display = 'block';

    var $titleSC = $title.querySelector('.sc');
    $titleSC.appendChild(titleSCImg);

    var $titleSep = $title.querySelector('.sep');

    var $titleEN = $title.querySelector('.en');
    $titleEN.appendChild(titleENImg);

    $titleSep.className += ' anime';

    await delay(600);

    titleSCImg.className += ' anime';
    titleENImg.className += ' anime';

    await delay(2000);

    $title.className += ' anime';

    await delay(600);
}

const DPR = window.devicePixelRatio;
var text;
var ctx2d;
var canvasWidth;
var canvasHeight;
var radius;
var lineWidth;
function loading() {
    if (percent < 1) {
        requestAnimationFrame(loading);

        percent += 0.001;
        if (total && loaded < total) {
            percent = Math.min(percent, (loaded + 1) / total * 0.95);
        } else if (total && loaded === total){
            percent = 1;
        }
    } else {
        percent = 1;
    }

    text.textContent = parseInt(percent * 100);

    ctx2d.clearRect(0, 0, canvasWidth, canvasHeight);

    ctx2d.beginPath();
    ctx2d.arc(radius, radius, radius * 0.7, -Math.PI *0.5, Math.PI * 1.5, false);
    ctx2d.lineWidth = lineWidth;
    ctx2d.strokeStyle = '#FFF';
    ctx2d.stroke();
    ctx2d.closePath();

    ctx2d.beginPath();
    ctx2d.arc(radius, radius, radius * 0.95, -Math.PI *0.5, Math.PI * 1.5 * percent, false);
    ctx2d.lineWidth = lineWidth;
    ctx2d.strokeStyle = '#FFF';
    ctx2d.stroke();
    ctx2d.closePath();

    ctx2d.beginPath();
    ctx2d.arc(radius, radius, radius * 0.95,  Math.PI * 1.5 * percent, Math.PI * 1.5, false);
    ctx2d.lineWidth = lineWidth;
    ctx2d.strokeStyle = '#333';
    ctx2d.stroke();
    ctx2d.closePath();
}

(async () => {
    await domReady();

    var $loading = document.querySelector('#prologue .loading');
    $loading.style.display = 'block';

    var canvas = document.querySelector('#prologue canvas');
    var rect = canvas.getBoundingClientRect();
    canvasWidth = canvas.width = rect.width * DPR;
    canvasHeight = canvas.height = rect.height * DPR;
    ctx2d = canvas.getContext('2d');
    radius = canvasWidth / 2;
    lineWidth = 2;

    text = document.querySelector('#prologue span');

    loading();
})();