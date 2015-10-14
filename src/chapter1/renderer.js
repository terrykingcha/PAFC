import {defer, domReady} from '../lib/promise';
import {width, height} from '../lib/env';

const COLOR = 0x000000;
const ALPHA = 0;

var deferred = defer();
export var ready = () => deferred.promise;

export var renderer;
export var domElement;

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

    renderer = new THREE.WebGLRenderer({
        alpha: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    renderer.setClearColor(COLOR, ALPHA);
    
    domElement = renderer.domElement;

    deferred.resolve();
})();
