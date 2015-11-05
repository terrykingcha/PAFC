import {defer, domReady} from '../lib/promise';
import {width, height} from '../lib/env';

const FOV = 45;
const NEAR = 1;
const FAR = 10000;
const ORTH_NEAR = -500;
const ORTH_FAR = 1000;
const X = 0;
const Y = 0;
const Z = 0;

var deferred = defer();
export var ready = () => deferred.promise;

export var camera;

export function resize() {
    var w = width();
    var h = height();

    camera.aspect = w / h;
    camera.updateProjectionMatrix();
}

(async () => {
    await domReady();
    var w = width();
    var h = height();

    camera = new THREE.PerspectiveCamera(FOV, w / h, NEAR, FAR);
    camera.position.set(X, Y, Z); //放置位置
    camera.updateProjectionMatrix();

    deferred.resolve();
})();
