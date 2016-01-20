import {defer} from '../lib/promise';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame, cancelAnimationFrame} from '../lib/util';


var deferred = defer();

// export var controls;

// export var render = () => controls.update();

var camera;
var raduis;
var lon = 90;
var lonStep = 0.05;
export function render() {
    lon += lonStep;
    var theta = THREE.Math.degToRad(lon);
    camera.position.x = raduis * Math.cos(theta);
    camera.position.z = raduis * Math.sin(theta);
    camera.lookAt(new THREE.Vector3(0, 15, 0)); 
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
}

export function init(_camera, _renderer) {
    // controls = new THREE.OrbitControls(_camera, _renderer.domElement);
    // controls.enableDamping = true;
    // controls.dampingFactor = 0.25;
    camera = _camera;
    raduis = camera.position.z;
    deferred.resolve();
}