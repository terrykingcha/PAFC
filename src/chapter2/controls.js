import {defer} from '../lib/promise';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame, cancelAnimationFrame} from '../lib/util';
import * as Box from './box';

export var camera;

var deferred = defer();
export var end = () => deferred.promise;

var start;
var step = 0.01;
function onMouseWheel(e) {
    e.preventDefault();

    var offset = e.wheelDelta * step;
    var z = camera.position.z;

    z += offset;
    z = Math.max(z, -Box.zSize());
    z = Math.min(z, start);

    if (z <= -Box.zSize()) {
        document.removeEventListener('mousewheel', onMouseWheel);
        deferred.resolve();
    }
    camera.position.z = z;
}

export function init(_camera, _renderer) {
    camera = _camera;
    start = camera.position.z;
    document.addEventListener('mousewheel', onMouseWheel, false);
}