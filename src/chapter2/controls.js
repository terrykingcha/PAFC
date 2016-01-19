import {defer} from '../lib/promise';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame, cancelAnimationFrame} from '../lib/util';

export var controls;

// export var render = () => controls.update();

var deferred = defer();

var camera;
var raduis;
var lon = 90;
var lonStep = 0.1;
export function render() {
    lon += lonStep;
    var theta = THREE.Math.degToRad(lon);
    camera.position.x = raduis * Math.cos(theta);
    camera.position.z = raduis * Math.sin(theta);
    camera.lookAt(new THREE.Vector3(0, 3, 0)); 
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
}

export function init(_camera, _renderer) {
    // controls = new THREE.OrbitControls(camera, renderer.domElement);
    // controls.enableDamping = true;
    // controls.dampingFactor = 0.25;
    // controls.enableZoom = true;
    // controls.enablePan = false;
    // controls.enableRotate = false;
    camera = _camera;
    raduis = camera.position.z;
    deferred.resolve();
}