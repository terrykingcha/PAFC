import {defer} from '../lib/promise';
import {width, height} from '../lib/env';
import {requestAnimationFrame, cancelAnimationFrame} from '../lib/util';


var camera;
var cloud;
var lon = 90;
var lonStep = 0.1;
var initRaduis;
var raduis;
var requestFrameId;
var isRotation = false;
export function rotation() {
    requestAnimationFrame(rotation);

    if (isRotation) {
        cloud.rotation.y -= THREE.Math.degToRad(lonStep);

        lon += lonStep;
        var theta = THREE.Math.degToRad(lon);
        camera.position.x = raduis * Math.cos(theta);
        camera.position.z = raduis * Math.sin(theta);
        camera.lookAt(new THREE.Vector3(0, 0, 0)); 
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld();
    }
}

function onMouseWheel(e) {
    e.preventDefault();

    if (isRotation) {
        raduis += e.wheelDelta * 0.001;
        raduis = Math.min(raduis, initRaduis);
        raduis = Math.max(raduis, 2.5);
    }
}

var flyInDeferred;
export function flyIn() {
    flyInDeferred = flyInDeferred || defer();

    lonStep += 0.02;
    lonStep = Math.min(lonStep, 1);
    raduis -= 0.2;
    raduis = Math.max(raduis, 0);

    if (raduis <= 1) {
        isRotation = false;
        lonStep = 0.1;
        flyInDeferred.resolve();
        flyInDeferred = null;
    } else {
        requestAnimationFrame(flyIn);
        return flyInDeferred.promise;
    }

}

var flyOutDeferred;
export function flyOut() {
    flyOutDeferred = flyOutDeferred || defer();

    isRotation = true;
    lonStep += 0.02;
    lonStep = Math.min(lonStep, 1);
    raduis += 0.2;
    raduis = Math.min(raduis, initRaduis);

    if (raduis >= initRaduis) {
        lonStep = 0.1;
        flyOutDeferred.resolve();
        flyOutDeferred = null;
    } else {
        requestAnimationFrame(flyOut);
        return flyOutDeferred.promise;
    }
}

export function init(_camera, _cloud) {
    cloud = _cloud;
    camera = _camera;
    raduis = initRaduis = camera.position.z;

    document.addEventListener('mousewheel', onMouseWheel, false);
    isRotation = true;
}