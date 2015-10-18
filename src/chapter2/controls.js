import {defer} from '../lib/promise';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame, cancelAnimationFrame} from '../lib/util';

export var camera;

var deferred = defer();
export var end = () => deferred.promise;

var startZoom;
var stepZoom = 0.0005;
function onMouseWheel(e) {
    e.preventDefault();

    var offset = -e.wheelDelta * stepZoom;
    var zoom = camera.zoom;

    zoom += offset;
    zoom = Math.max(zoom, startZoom);

    if (zoom <= 0) {
        document.removeEventListener('mousewheel', onMouseWheel);
        deferred.resolve();
    }
    camera.zoom = zoom;
}

export function init(_camera, _renderer) {
    camera = _camera;
    startZoom = camera.zoom;
    document.addEventListener('mousewheel', onMouseWheel, false);
}