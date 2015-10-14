import {defer, domReady} from '../lib/promise';
import {width, height} from '../lib/env';

const VIEW_ANGLE = 60;
const NEAR = 1;
const FAR = 10000;
const X = 0;
const Y = 0;
const Z = 0;

var deferred = defer();
export var ready = () => deferred.promise;

export var camera;

export function resize() {
    var w = width();
    var h = height();

    renderer.setSize(w, h);
}

(async () => {
    await domReady();
    var w = width();
    var h = height();

    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, w / h, NEAR, FAR); /* 摄像机视角，视口长宽比，近切面，远切面 */
    camera.position.set(X, Y, Z); //放置位置

    deferred.resolve();
})();
