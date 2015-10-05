import {defer} from '../lib/promise';

export var camera;

var deferred = defer();
export var end = () => deferred.promise;

function onMouseWheel(e) {
    e.preventDefault();
    var offset = -event.wheelDeltaY * 0.005;

    camera.position.z += offset;
    camera.position.z = Math.min(camera.position.z, 200);
    camera.position.z = Math.max(camera.position.z, -5);  

    // if (camera.position.z === -5) {
        // document.removeEventListener('mousewheel', onMouseWheel);
        // deferred.resolve();
    // }

    camera.updateProjectionMatrix();
}

export function init(_camera) {
    camera = _camera;
    document.addEventListener('mousewheel', onMouseWheel, false);
}