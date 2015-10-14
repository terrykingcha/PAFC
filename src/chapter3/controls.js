import {defer} from '../lib/promise';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame, cancelAnimationFrame} from '../lib/util';

export var camera;
export var controls;
export var update = () => {
    controls.update();
}

var deferred = defer();
export var end = () => deferred.promise;

export function init(_camera, _renderer) {
    camera = _camera;
    controls = new THREE.OrbitControls(_camera, _renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.7;
    controls.enableZoom = true;
}