import './prologue.less';
import {defer, domReady, pageLoad, delay} from './lib/promise';
import {width, height, dpr} from './lib/env';
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
    percent = loaded / total;
};

export function onProgress(xhr) {};

export function onError(xhr) {}

export async function hide() {
    var $prologue = document::$find('#prologue')::$addClass('fadeOut');
    await delay(450);
    $prologue::$remove();
}

const LINE_WIDTH = 2;
function renderPercent({
    canvas,
    ctx2d
}) {
    var {width, height} = canvas;
    var radius = width / 2;

    ctx2d.clearRect(0, 0, width, height);

    ctx2d.beginPath();
    ctx2d.arc(radius, radius, radius * 0.95, -Math.PI *0.5, Math.PI * 1.5 * percent, false);
    ctx2d.lineWidth = LINE_WIDTH;
    ctx2d.strokeStyle = '#FFF';
    ctx2d.stroke();
    ctx2d.closePath();

    ctx2d.beginPath();
    ctx2d.arc(radius, radius, radius * 0.95,  Math.PI * 1.5 * percent, Math.PI * 1.5, false);
    ctx2d.lineWidth = LINE_WIDTH;
    ctx2d.strokeStyle = '#333';
    ctx2d.stroke();
    ctx2d.closePath();
}

function template() {
    return `
        <div id="prologue">
            <div class="loading">
                <canvas></canvas>
                <div></div>
                <p></p>
            </div>
        </div>
    `;
}

(async () => {
    await domReady();

    document.body::$append(template());

    var $loading = document::$find('#prologue .loading')::$show();
    var $percent = document::$find('#prologue p');

    var canvas = document::$find('#prologue canvas');
    var {width, height} = canvas.getBoundingClientRect();

    canvas.width = width * dpr();
    canvas.height = height * dpr();
    
    var ctx2d = canvas.getContext('2d');

    void function checkPercent() {
        if (percent < 1) {
            requestAnimationFrame(checkPercent);

            percent += 0.0001;
            if (total && loaded < total) {
                percent = Math.min(percent, (loaded + 1) / total * 0.95);
            } else if (total && loaded === total) {
                percent = 1;
            }
        }

        $percent::$text(parseInt(percent * 100));

        renderPercent({
            canvas,
            ctx2d
        });

        if (loaded && total && loaded === total) {
            deferred.resolve();
        }
    }();
})();