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

const WAVE_COLOR = [[52, 240, 226], [207, 28, 60], [41, 122, 66]];
function initWave(canvas) {
    var {width, height} = canvas.getBoundingClientRect();
    width *= dpr();
    height *= dpr();
    canvas.width = width;
    canvas.height = height;

    var maxX = width / 2;
    var minX = -width / 2;
    var maxY = height / 2;
    var minY = -height / 2;
    var colorIndex = Math.floor(Math.random() * WAVE_COLOR.length)

    canvas.minX = width * Math.random() * 0.5 + minX;
    canvas.maxX = (maxX - canvas.minX) * (Math.random() * 0.4 + 0.2) + canvas.minX;
    canvas.minY = -(canvas.maxX - canvas.minX) / width / 1.5 * height
    canvas.maxY = -canvas.minY;
    canvas.curY = Math.random() * canvas.maxY;

    canvas.color = `rgba(${WAVE_COLOR[colorIndex].join(',')}, ${Math.random() * 0.3 + 0.3})`;
    // canvas.color = `rgba(${Math.round(Math.random() * 255)}, ${Math.round(Math.random() * 255)}, ${Math.round(Math.random() * 255)}, ${Math.random() * 0.3 + 0.3})`;
    canvas.speed = canvas.maxY / (Math.random() * 50 + 50);
}

function renderWave({canvas, ctx2d}) {
    var {width, height, minX, maxX, minY, maxY, curY, color, speed} = canvas;
    ctx2d.clearRect(0, 0, width, height);

    function axis(x, y) {
        return [width / 2 + x, height / 2 - y];
    }

    function bezier(cx, cy) {
        return axis(minX + (maxX - minX) * cx / 2, curY * cy);
    }

    var path = new Path2D();

    path.moveTo(...axis(minX, 0));
    var [c1X, c1Y] = bezier(1, 0); //axis((maxX - minX) / 4 + minX, 0);
    var [c2X, c2Y] = bezier(0.8, 1); //axis((maxX - minX) / 4 + minX, curY);
    path.bezierCurveTo(c1X, c1Y, c2X, c2Y, ...axis((maxX - minX) / 2 + minX, curY));

    var [c1X, c1Y] = bezier(1.2, 1); //axis((maxX - minX) * 0.75 + minX, curY);
    var [c2X, c2Y] = bezier(1, 0); //axis((maxX - minX) * 0.75 + minX, 0);
    path.bezierCurveTo(c1X, c1Y, c2X, c2Y, ...axis(maxX, 0));

    var [c1X, c1Y] = bezier(1, 0); //axis((maxX - minX) * 0.75 + minX, 0);
    var [c2X, c2Y] = bezier(1.2, -1); //axis((maxX - minX) * 0.75 + minX, -curY);
    path.bezierCurveTo(c1X, c1Y, c2X, c2Y, ...axis((maxX - minX) / 2 + minX, -curY));

    var [c1X, c1Y] = bezier(0.8, -1) // ;axis((maxX - minX) / 4 + minX, -curY);
    var [c2X, c2Y] = bezier(1, 0); //axis((maxX - minX) / 4 + minX, 0);
    path.bezierCurveTo(c1X, c1Y, c2X, c2Y, ...axis(minX, 0));

    path.closePath();

    ctx2d.fillStyle = color;
    ctx2d.fill(path);

    curY += speed;
    if (curY >= maxY) {
        canvas.curY = maxY;
        canvas.speed = -speed;
    } else if (curY <= minY) {
        canvas.curY = minY;
        canvas.speed = -speed;
    } else {
        canvas.curY = curY;
    }

}

const LINE_WIDTH = 2;
function renderPercent({canvas, ctx2d}) {
    var {width, height} = canvas;
    var radius = width / 2;

    ctx2d.clearRect(0, 0, width, height);

    var offset = -Math.PI / 2;
    var angle = Math.PI * 2 * percent;

    ctx2d.beginPath();
    ctx2d.arc(radius, radius, radius * 0.95, offset, angle + offset, false);
    ctx2d.lineWidth = LINE_WIDTH;
    ctx2d.strokeStyle = '#FFF';
    ctx2d.stroke();
    ctx2d.closePath();

    ctx2d.beginPath();
    ctx2d.arc(radius, radius, radius * 0.95, angle + offset, Math.PI * 2 + offset, false);
    ctx2d.lineWidth = LINE_WIDTH;
    ctx2d.strokeStyle = '#333';
    ctx2d.stroke();
    ctx2d.closePath();
}

function template() {
    return `
        <div id="prologue">
            <div class="loading">
                <canvas class="progress"></canvas>
                <canvas class="wave"></canvas>
                <canvas class="wave"></canvas>
                <canvas class="wave"></canvas>
                <canvas class="wave"></canvas>
                <canvas class="wave"></canvas>
                <canvas class="wave"></canvas>
                <canvas class="wave"></canvas>
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

    var $progress = document::$find('#prologue .progress');
    var {width, height} = $progress.getBoundingClientRect();

    $progress.width = width * dpr();
    $progress.height = height * dpr();

    var $waves = document::$findAll('#prologue .wave');
    $waves.forEach($wave => initWave($wave));

    void function checkPercent() {
        if (percent < 1) {
            requestAnimationFrame(checkPercent);
        }

        $percent::$text(parseInt(percent * 100));
        $waves.forEach($wave => renderWave({canvas: $wave, ctx2d: $wave.getContext('2d')}));
        renderPercent({canvas: $progress, ctx2d: $progress.getContext('2d')});

        if (loaded && total && loaded === total) {
            deferred.resolve();
        }
    }();
})();