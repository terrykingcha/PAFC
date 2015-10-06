import {defer} from '../lib/promise';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame, cancelAnimationFrame} from '../lib/util';

export var camera;

var deferred = defer();
export var end = () => deferred.promise;

function onMouseWheel(e) {
    e.preventDefault();
}

var startZ;
var endZ = -5;
var zoom = 0;
var zoomStep = 0.005;
var easeIn = CubicBezier.easeIn;
var requestFrameId;
function animate() {
    requestFrameId = requestAnimationFrame(animate);
    var z = startZ + (endZ - startZ) * easeIn(zoom);
    zoom += zoomStep;
    if (z <= -5) {
        document.removeEventListener('mousewheel', onMouseWheel);
        cancelAnimationFrame(requestFrameId);
        deferred.resolve();
    } else {
        camera.position.z = z;
    }
    camera.updateProjectionMatrix();
}

export function init(_camera, _renderer) {
    // var controls = new THREE.OrbitControls(_camera, _renderer.domElement);
    // controls.addEventListener('change', function() {
    //     controls.update();
    // });
    camera = _camera;
    startZ = camera.position.z;
    document.addEventListener('mousewheel', onMouseWheel, false);
    animate();
}