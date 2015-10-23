import {defer} from '../lib/promise';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame, cancelAnimationFrame} from '../lib/util';

export var camera;

var deferred = defer();
export var end = () => deferred.promise;

export function init(_camera, _renderer) {
    camera = _camera;
}