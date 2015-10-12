import {defer} from '../lib/promise';
import CubicBezier from '../lib/cubicbezier';
import {requestAnimationFrame, cancelAnimationFrame} from '../lib/util';

export var camera;

var deferred = defer();
export var end = () => deferred.promise;

// var startZ;
// var endZ = -5;
// var zoom = 0;
// var zoomStep = 0.005;
// var easeIn = CubicBezier.easeIn;
// var requestFrameId;
// function onMouseWheel(e) {
//     e.preventDefault();
// }

// function animate() {
//     requestFrameId = requestAnimationFrame(animate);
//     var z = startZ + (endZ - startZ) * easeIn(zoom);
//     zoom += zoomStep;
//     if (z <= -5) {
//         document.removeEventListener('mousewheel', onMouseWheel);
//         cancelAnimationFrame(requestFrameId);
//         deferred.resolve();
//     } else {
//         camera.position.z = z;
//     }
//     camera.updateProjectionMatrix();
// }

var startZ;
var stepRatio = 0.005;
function onMouseWheel(e) {
    e.preventDefault();

    var offset = e.wheelDelta * stepRatio;
    var z = camera.position.z;

    z += offset;
    z = Math.min(z, startZ);
    z = Math.max(z, 0);

    if (z <= 0) {
        document.removeEventListener('mousewheel', onMouseWheel);
        deferred.resolve();
    }
    camera.position.z = z;
    camera.updateProjectionMatrix();
}

export function init(_camera, _renderer) {
    camera = _camera;
    startZ = camera.position.z;
    document.addEventListener('mousewheel', onMouseWheel, false);
    // animate();
}