import {defer} from '../lib/promise';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame, cancelAnimationFrame} from '../lib/util';

export var controls;

export var render = () => controls.update();

var deferred = defer();

export function init(camera, renderer) {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.2;
    controls.enableZoom = true;
    deferred.resolve();
}