import {defer} from '../lib/promise';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame, cancelAnimationFrame} from '../lib/util';

export var controls;

export var render = () => controls.update();

var deferred = defer();

export function init(objects, renderer) {
    controls = new THREE.OrbitControls(objects, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    // controls.enablePan = false;
    // controls.enableRotate = false;
    deferred.resolve();
}